-- Allow authenticated clients to manage projects through RLS.
-- RLS policies on public.projects still enforce org scope and manager roles.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.projects to authenticated;
