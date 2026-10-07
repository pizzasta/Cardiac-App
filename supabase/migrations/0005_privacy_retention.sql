-- Privacy retention for usage-limit counters (see the Privacy Policy,
-- "How long we keep data").
--
-- 1. Stale counters are purged opportunistically (about 1 in 50 calls), so
--    anonymous rows keyed to a hashed IP live for about a day at most.
-- 2. delete_account() also removes the user's own counters, which have no
--    foreign key to auth.users and so are not covered by the cascade.

create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

create or replace function public.check_rate_limit(p_id text, p_max int, p_window_secs int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rate_limits%rowtype;
begin
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

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

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from public.rate_limits where id like 'pulse:u:' || auth.uid()::text || ':%';
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
