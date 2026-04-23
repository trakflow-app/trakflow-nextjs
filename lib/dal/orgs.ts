import { createClient } from '@/lib/supabase/server';

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

  if (!user) throw new Error('Authentication required.');

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (accountError) throw new Error('Failed to load account.');

  if (!account?.org_id) return null;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('join_code')
    .eq('id', account.org_id)
    .single();

  if (orgError) throw new Error('Failed to load organization.');

  return org?.join_code ?? null;
}
