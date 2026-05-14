-- Re-apply browser client grants for material creation.
-- This is safe to run more than once and fixes hosted databases that predate
-- the original materials grants migration.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.materials to authenticated;
grant select on table public.projects to authenticated;
