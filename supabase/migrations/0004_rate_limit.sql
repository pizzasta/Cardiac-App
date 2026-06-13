-- Server-side rate limiting for the Pulse edge function.
-- A tiny fixed-window counter keyed by an arbitrary string (per-user or per-IP).
-- Only the service role / SECURITY DEFINER function touches it.

create table if not exists public.rate_limits (
  id           text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- No policies on purpose: clients can never read/write this directly.

-- Returns true if the call is allowed (and records it), false if over the limit.
create or replace function public.check_rate_limit(p_id text, p_max int, p_window_secs int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rate_limits%rowtype;
begin
  select * into r from public.rate_limits where id = p_id for update;

  if not found then
    insert into public.rate_limits (id, count, window_start) values (p_id, 1, now());
    return true;
  end if;

  -- Window expired → reset.
  if now() - r.window_start > make_interval(secs => p_window_secs) then
    update public.rate_limits set count = 1, window_start = now() where id = p_id;
    return true;
  end if;

  -- Within window and under the cap → count it.
  if r.count < p_max then
    update public.rate_limits set count = r.count + 1 where id = p_id;
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
