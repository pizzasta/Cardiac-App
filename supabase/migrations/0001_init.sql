-- Circadia — initial schema
-- Rhythm analysis app: users, onboarding, archetypes, rhythm types, daily
-- check-ins, emotional trends, streaks, saved results.
--
-- Conventions: uuid PKs, created_at/updated_at on mutable rows, RLS on every
-- table (own-row access), reference data world-readable, derived data as views.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ───────────────────────── Reference data ─────────────────────────

-- Rhythm types: the broad pattern an archetype belongs to. Kept separate so we
-- can add/retune archetypes without schema changes.
create table if not exists public.rhythm_types (
  id          text primary key,                 -- 'nocturnal', 'steady', ...
  label       text not null,
  description text
);

-- Animal archetypes (the 6 results), each tied to a rhythm type.
create table if not exists public.archetypes (
  id             text primary key,              -- 'dolphin', 'wolf', ...
  name           text not null,
  emoji          text not null,
  one_liner      text,
  accent         text,                          -- hex (global hot-pink)
  tint           text,                          -- hex (per-animal signature)
  rhythm_type_id text references public.rhythm_types(id),
  sort_order     int  not null default 0
);
create index if not exists archetypes_rhythm_type_idx on public.archetypes (rhythm_type_id);

-- ───────────────────────── User data ─────────────────────────

-- 1:1 with auth.users. Created automatically by a trigger on signup.
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  onboarding_complete  boolean not null default false,
  current_archetype_id text references public.archetypes(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Saved results: one row per quiz completion. The most recent is "current".
create table if not exists public.results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  archetype_id text not null references public.archetypes(id),
  peak         text,
  crash        text,
  recharge     text,
  created_at   timestamptz not null default now()
);
create index if not exists results_user_created_idx on public.results (user_id, created_at desc);

-- Onboarding answers (the quiz). One row per answered question, optionally tied
-- to the result it produced. jsonb-free for easy per-question analytics.
create table if not exists public.onboarding_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  result_id   uuid references public.results(id) on delete set null,
  question_id text not null,
  answer      text not null,
  answered_at timestamptz not null default now()
);
create index if not exists onboarding_answers_user_idx   on public.onboarding_answers (user_id);
create index if not exists onboarding_answers_result_idx on public.onboarding_answers (result_id);

-- Daily check-ins: one per local day (upsert on conflict).
create table if not exists public.check_ins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  level      text not null check (level in ('wired','steady','flat')),
  reason     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);
-- Primary access pattern: a user's recent days, newest first.
create index if not exists check_ins_user_date_idx on public.check_ins (user_id, local_date desc);

-- Streaks: 1 row per user, maintained by trigger so reads are O(1).
create table if not exists public.streaks (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  current_streak int  not null default 0,
  longest_streak int  not null default 0,
  last_check_in  date,
  updated_at     timestamptz not null default now()
);

-- ───────────────────────── Derived: emotional trends ─────────────────────────
-- Weekly aggregate over check-ins. A view = always fresh, nothing to sync.
-- security_invoker so the querying user's RLS on check_ins applies.
create or replace view public.emotional_trends
with (security_invoker = on) as
select
  user_id,
  date_trunc('week', local_date)::date as week,
  count(*)                              as check_ins,
  count(*) filter (where level = 'wired')  as wired,
  count(*) filter (where level = 'steady') as steady,
  count(*) filter (where level = 'flat')   as flat
from public.check_ins
group by user_id, date_trunc('week', local_date);

-- ───────────────────────── Triggers ─────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated on public.profiles;
create trigger profiles_set_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists check_ins_set_updated on public.check_ins;
create trigger check_ins_set_updated before update on public.check_ins
  for each row execute function public.set_updated_at();

-- Create a profile + streak row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.streaks (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Maintain streaks as new check-in days arrive.
create or replace function public.update_streak()
returns trigger language plpgsql security definer set search_path = public as $$
declare cur int; last_d date;
begin
  select current_streak, last_check_in into cur, last_d
    from public.streaks where user_id = new.user_id for update;

  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_check_in)
    values (new.user_id, 1, 1, new.local_date);
    return new;
  end if;

  if last_d is null or new.local_date = last_d + 1 then
    cur := coalesce(cur, 0) + 1;            -- consecutive day
  elsif new.local_date > last_d then
    cur := 1;                               -- gap → reset
  else
    return new;                             -- same/older day → no change
  end if;

  update public.streaks
     set current_streak = cur,
         longest_streak = greatest(longest_streak, cur),
         last_check_in  = greatest(coalesce(last_check_in, new.local_date), new.local_date),
         updated_at     = now()
   where user_id = new.user_id;
  return new;
end; $$;

drop trigger if exists check_ins_streak on public.check_ins;
create trigger check_ins_streak after insert on public.check_ins
  for each row execute function public.update_streak();

-- ───────────────────────── Row-Level Security ─────────────────────────

alter table public.profiles           enable row level security;
alter table public.results            enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.check_ins          enable row level security;
alter table public.streaks            enable row level security;
alter table public.archetypes         enable row level security;
alter table public.rhythm_types       enable row level security;

-- Own-row access for user data.
create policy "own profile"    on public.profiles           for all
  using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own results"    on public.results            for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own onboarding" on public.onboarding_answers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own check_ins"  on public.check_ins          for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Streaks are written only by the (security-definer) trigger; users read theirs.
create policy "own streaks"    on public.streaks            for select
  using (auth.uid() = user_id);

-- Reference data is world-readable (incl. anon), never client-writable.
create policy "read archetypes"   on public.archetypes   for select using (true);
create policy "read rhythm_types" on public.rhythm_types for select using (true);

-- ───────────────────────── Seed reference data ─────────────────────────

insert into public.rhythm_types (id, label, description) values
  ('variable',  'Variable',  'Sensitive, light, easily over-stimulated'),
  ('nocturnal', 'Nocturnal', 'Energy peaks late, creative in bursts'),
  ('steady',    'Steady',    'Consistent and durable, burnout-prone'),
  ('rapid',     'Rapid',     'Fast, high-tempo, prone to scatter'),
  ('vigilant',  'Vigilant',  'Alert, scanning, anticipatory'),
  ('absorbent', 'Absorbent', 'Emotionally attuned, takes on environments')
on conflict (id) do nothing;

insert into public.archetypes (id, name, emoji, one_liner, accent, tint, rhythm_type_id, sort_order) values
  ('dolphin',     'Dolphin',     '🐬', 'Light sleeper, sharp mind, runs hot',       '#FF2E7E', '#4FC3F7', 'variable',  1),
  ('wolf',        'Wolf',        '🐺', 'Night energy, creative in bursts',          '#FF2E7E', '#9B6BFF', 'nocturnal', 2),
  ('bear',        'Bear',        '🐻', 'Steady and reliable, burnout-prone',        '#FF2E7E', '#FF9F45', 'steady',    3),
  ('hummingbird', 'Hummingbird', '🐦', 'Fast, anxious, always multitasking',        '#FF2E7E', '#3DDC97', 'rapid',     4),
  ('fox',         'Fox',         '🦊', 'Hyper-alert planner, always scanning',      '#FF2E7E', '#FF6B3D', 'vigilant',  5),
  ('octopus',     'Octopus',     '🐙', 'Emotionally absorbent, social masker',      '#FF2E7E', '#FF5DA2', 'absorbent', 6)
on conflict (id) do nothing;
