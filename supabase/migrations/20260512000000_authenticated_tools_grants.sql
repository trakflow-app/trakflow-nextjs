-- Allow authenticated browser clients to read and write tools through RLS.
-- RLS policies on public.tools already enforce org-scoping and role restrictions.
-- This grant is the prerequisite Postgres privilege check that must pass first.
grant select, insert, update, delete on public.tools to authenticated;
