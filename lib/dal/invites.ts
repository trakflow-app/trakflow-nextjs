import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

const INVITES_ERROR_MESSAGES = {
  authenticationRequired: 'Authentication required.',
  failedToCreateForemanInvite: 'Failed to create foreman invite.',
  missingInviteToken: 'No token returned from invite creation.',
  failedToClaimInvite: 'Failed to claim invite.',
  failedToLoadPendingForemanInvites: 'Failed to load pending foreman invites.',
} as const;
const FOREMAN_INVITE_ROLE: Database['public']['Enums']['user_role'] = 'FOREMAN';

/**
 * Internal claim failure details returned by the invite workflow function.
 * The action layer maps these to UI-safe messages.
 */
export const CLAIM_INVITE_ERROR_DETAILS = {
  accountRequired: 'Account row is required before claiming an invite.',
  alreadyInOrganization: 'Caller already belongs to an organization.',
  emailMismatch: 'Invite email does not match the authenticated user.',
  invalidExpiredOrUsed: 'Invite token is invalid, expired, or already used.',
} as const;

type OrgInviteRow = Database['public']['Tables']['org_invites']['Row'];

/**
 * Pending foreman invite data displayed on the owner invite page.
 */
export type PendingForemanInvite = Pick<
  OrgInviteRow,
  'created_at' | 'expires_at' | 'invited_email' | 'token'
>;

/**
 * TODO: Standardize lib/** error handling behind a shared pattern once
 * invite DAL helpers and actions settle into a stable shape.
 */
function createInvitesError(message: string): Error {
  return new Error(message);
}

/**
 * Creates a foreman invite for the given email address.
 * Calls the create_org_invite workflow function as the authenticated user.
 * Returns the generated invite token.
 */
export async function createForemanInvite(email: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw createInvitesError(INVITES_ERROR_MESSAGES.authenticationRequired);
  }

  const { data: token, error } = await supabase.rpc('create_org_invite', {
    role: FOREMAN_INVITE_ROLE,
    invited_email: email,
  });

  if (error) {
    throw createInvitesError(
      INVITES_ERROR_MESSAGES.failedToCreateForemanInvite,
    );
  }

  if (!token) {
    throw createInvitesError(INVITES_ERROR_MESSAGES.missingInviteToken);
  }

  return token;
}

/**
 * Claims an org invite using the provided token.
 * Calls the claim_org_invite workflow function as the authenticated user.
 * Returns the org ID the caller has joined.
 */
export async function claimInvite(token: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw createInvitesError(INVITES_ERROR_MESSAGES.authenticationRequired);
  }

  const { data: orgId, error } = await supabase.rpc('claim_org_invite', {
    token,
  });

  if (error) {
    throw createInvitesError(
      error.message || INVITES_ERROR_MESSAGES.failedToClaimInvite,
    );
  }

  if (!orgId) {
    throw createInvitesError(INVITES_ERROR_MESSAGES.failedToClaimInvite);
  }

  return orgId;
}

/**
 * Lists active foreman invites for the authenticated user's organization.
 * Used by the owner invite page so manual invite links stay visible until claimed.
 */
export async function listPendingForemanInvites(): Promise<
  PendingForemanInvite[]
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw createInvitesError(INVITES_ERROR_MESSAGES.authenticationRequired);
  }

  const { data: invites, error } = await supabase
    .from('org_invites')
    .select('created_at, expires_at, invited_email, token')
    .eq('role', FOREMAN_INVITE_ROLE)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw createInvitesError(
      INVITES_ERROR_MESSAGES.failedToLoadPendingForemanInvites,
    );
  }

  return invites ?? [];
}
