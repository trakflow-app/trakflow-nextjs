import { createClient } from '@/lib/supabase/server';

const ORGS_ERROR_MESSAGES = {
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
 * Reads the join code for the provided organization.
 */
export async function getOrgJoinCode(orgId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('join_code')
    .eq('id', orgId)
    .single();

  if (orgError) {
    console.error('getOrgJoinCode organizations query failed', {
      orgId,
      message: orgError.message,
      details: orgError.details,
      hint: orgError.hint,
      code: orgError.code,
    });
    throw createOrgsError(ORGS_ERROR_MESSAGES.failedToLoadOrganization);
  }

  return org?.join_code ?? null;
}
