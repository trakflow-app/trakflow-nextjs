-- =============================================================================
-- MIGRATION 4: hosted bootstrap grants for service_role
-- =============================================================================
-- service_role bypasses RLS, but it still needs schema/table privileges when
-- writing through PostgREST with the service role key.

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant all privileges on sequences to service_role;

alter default privileges in schema public
grant execute on functions to service_role;
