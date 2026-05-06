-- Allow authenticated users to read organization invite rows through RLS.
grant usage on schema public to authenticated;
grant select on public.org_invites to authenticated;
