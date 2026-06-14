import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return user;
});

const getAuthenticatedAccount = cache(async () => {
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, email, role, org_id, created_at')
    .eq('id', user.id)
    .single();

  return { user, account };
});

/**
 * Asserts the current session belongs to a user with the given role.
 * Redirects to /login if unauthenticated, to / if the role does not match.
 * Returns the authenticated user and their full account row.
 */
export async function requireRole(role: UserRole) {
  const { user, account } = await getAuthenticatedAccount();

  if (!account || account.role !== role) redirect('/');

  return { user, account };
}

/**
 * Asserts the current session belongs to a user with one of the given roles.
 */
export async function requireAnyRole(roles: readonly UserRole[]) {
  const { user, account } = await getAuthenticatedAccount();

  if (!account || !account.role || !roles.includes(account.role)) redirect('/');

  return { user, account };
}

/**
 * Asserts the current session belongs to an onboarded org member.
 * Redirects to /login if unauthenticated.
 * Redirects to / if the account has no org, no role, or does not exist.
 * Returns the authenticated user and their full account row.
 */
export async function requireOrgMember() {
  const { user, account } = await getAuthenticatedAccount();

  if (!account || !account.org_id || !account.role) redirect('/');

  return { user, account };
}

/**
 * Asserts the current session is authenticated.
 * Redirects to /login if not.
 * Returns the authenticated user.
 */
export async function requireAuth() {
  return getAuthenticatedUser();
}
