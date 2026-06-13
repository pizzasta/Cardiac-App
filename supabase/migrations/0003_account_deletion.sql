-- Self-service account deletion (GDPR/CCPA "right to delete").
-- SECURITY DEFINER so a signed-in user can remove their own auth account; the
-- on-delete-cascade FKs then clean up all of their rows automatically.

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only a signed-in user may call it (and it only ever deletes *their* account).
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
