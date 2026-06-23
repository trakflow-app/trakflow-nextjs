import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

/**
 * Loads the full Auth user only for pages that need fresh profile metadata.
 */
const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return user;
});

/**
 * Verifies the current JWT and returns its authenticated user id.
 */
const getAuthenticatedUserId = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  // Redirect when the token is missing, expired, or invalid.
  if (error || !userId) redirect('/login');

  return userId;
});

/**
 * Loads the application account associated with the verified JWT.
 */
const getAuthenticatedAccount = cache(async () => {
  // Use verified JWT claims so dashboard requests avoid a separate Auth call.
  const userId = await getAuthenticatedUserId();
  const supabase = await createClient();

  // Load role and organization data from the application-owned account table.
  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, email, role, org_id, created_at')
    .eq('id', userId)
    .single();

  return { userId, account };
});

/**
 * Asserts the current session belongs to a user with the given role.
 * Redirects to /login if unauthenticated, to / if the role does not match.
 * Returns the authenticated user and their full account row.
 */
export async function requireRole(role: UserRole) {
  const { userId, account } = await getAuthenticatedAccount();

  // Redirect users who do not have the required application role.
  if (!account || account.role !== role) redirect('/');

  return { userId, account };
}

/**
 * Asserts the current session belongs to a user with one of the given roles.
 */
export async function requireAnyRole(roles: readonly UserRole[]) {
  const { userId, account } = await getAuthenticatedAccount();

  // Redirect users whose role is missing or outside the allowed set.
  if (!account || !account.role || !roles.includes(account.role)) redirect('/');

  return { userId, account };
}

/**
 * Asserts the current session belongs to an onboarded org member.
 * Redirects to /login if unauthenticated.
 * Redirects to / if the account has no org, no role, or does not exist.
 * Returns the authenticated user and their full account row.
 */
export async function requireOrgMember() {
  const { userId, account } = await getAuthenticatedAccount();

  // Redirect accounts that have not completed organization onboarding.
  if (!account || !account.org_id || !account.role) redirect('/');

  return { userId, account };
}

/**
 * Asserts the current session is authenticated.
 * Redirects to /login if not.
 * Returns the authenticated user.
 */
export async function requireAuth() {
  return getAuthenticatedUser();
}
