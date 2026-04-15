-- Allow authenticated users to read their own account row through RLS.
grant usage on schema public to authenticated;
grant select on public.accounts to authenticated;
