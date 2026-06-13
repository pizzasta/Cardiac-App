-- Enable Supabase Realtime for the tables the app subscribes to.
-- Guarded so re-running is safe (ALTER PUBLICATION ... ADD errors if the table
-- is already a member).

do $$
begin
  begin
    alter publication supabase_realtime add table public.check_ins;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.streaks;
  exception when duplicate_object then null;
  end;
end $$;
