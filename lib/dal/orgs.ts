import { createClient } from '@/lib/supabase/server';

const ORGS_ERROR_MESSAGES = {
  authenticationRequired: 'Authentication required.',
  failedToLoadAccount: 'Failed to load account.',
  failedToLoadOrganization: 'Failed to load organization.',
} as const;

/**
 * TODO: Standardize lib/** error handling behind a shared pattern once
 * invite actions and DAL helpers settle into a stable shape.
 */
function createOrgsError(message: string): Error {
  return new Error(message);
}

/**
 * Reads the join code for the authenticated user's organization.
 * Returns null only when the user has no org yet (valid unboarded state).
 * Throws for unauthenticated callers or actual database failures.
 */
export async function getOrgJoinCode(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw createOrgsError(ORGS_ERROR_MESSAGES.authenticationRequired);
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (accountError) {
    throw createOrgsError(ORGS_ERROR_MESSAGES.failedToLoadAccount);
  }

  if (!account?.org_id) return null;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('join_code')
    .eq('id', account.org_id)
    .single();

  if (orgError) {
    throw createOrgsError(ORGS_ERROR_MESSAGES.failedToLoadOrganization);
  }

  return org?.join_code ?? null;
}
