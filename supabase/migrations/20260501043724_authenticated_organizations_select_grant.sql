-- Allow authenticated users to read organization rows through RLS.
grant usage on schema public to authenticated;
grant select on public.organizations to authenticated;
