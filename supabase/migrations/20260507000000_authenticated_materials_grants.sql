-- Allow authenticated browser clients to access materials through RLS.
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.materials to authenticated;
grant select on public.projects to authenticated;
