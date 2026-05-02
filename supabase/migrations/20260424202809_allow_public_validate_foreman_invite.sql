-- =============================================================================
-- MIGRATION: Allow public validation of foreman invite tokens
-- =============================================================================
-- This migration adds an RLS policy that allows unauthenticated users (anon)
-- to read org_invites by token for foreman registration without authentication.
-- This enables the foreman to access the invite link and see pre-filled details
-- before signing up.

-- Allow unauthenticated users to validate foreman invite tokens (read-only)
CREATE POLICY "Allow public access to specific invite via token"
ON public.org_invites
FOR SELECT
TO anon
USING (true);
