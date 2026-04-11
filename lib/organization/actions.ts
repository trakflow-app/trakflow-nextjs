'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { orgActions } from '@/locales/lib/organization/actions-locales';

/**
 * Create a new organization and assign the current user as OWNER
 * Uses the create_org() database function
 */
export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  const orgName = formData.get('name') as string;

  if (!orgName || !orgName.trim()) {
    return { error: orgActions.errors.orgNameRequired };
  }

  // Call the database workflow function
  const { data: error } = await supabase.rpc('create_org', {
    name: orgName.trim(),
  });

  if (error) {
    console.error('create_org error:', error);

    // Map database errors to user-friendly messages
    if (error.message?.includes('already belongs to an organization')) {
      return { error: orgActions.errors.alreadyInOrg };
    }
    if (error.message?.includes('Organization name is required')) {
      return { error: orgActions.errors.orgNameRequired };
    }

    return { error: orgActions.errors.createFailed };
  }

  revalidatePath('/owner');
  redirect('/owner');
}

/**
 * Join an organization using a join code (assigns user as CREW)
 * Uses the join_org_by_code() database function
 */
export async function joinOrganization(joinCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  if (!joinCode || !joinCode.trim()) {
    return { error: orgActions.errors.joinCodeRequired };
  }

  // Normalize join code (uppercase, preserve hyphen)
  const normalizedCode = joinCode.trim().toUpperCase();

  // Client-side validation for better UX
  if (!/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(normalizedCode)) {
    return { error: orgActions.errors.invalidJoinCode };
  }

  // Call the database workflow function
  const { data: error } = await supabase.rpc('join_org_by_code', {
    code: normalizedCode,
  });

  if (error) {
    console.error('join_org_by_code error:', error);

    // Map database errors to user-friendly messages
    if (error.message?.includes('already belongs to an organization')) {
      return { error: orgActions.errors.alreadyInOrg };
    }
    if (error.message?.includes('Join code was not found')) {
      return { error: orgActions.errors.invalidJoinCode };
    }
    if (error.message?.includes('format is invalid')) {
      return { error: orgActions.errors.invalidJoinCode };
    }

    return { error: orgActions.errors.joinFailed };
  }

  revalidatePath('/crew');
  redirect('/crew');
}

/**
 * Regenerate the organization's join code (OWNER only)
 * Uses the regenerate_join_code() database function
 */
export async function regenerateJoinCode() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  // Call the database workflow function
  const { data: newCode, error } = await supabase.rpc('regenerate_join_code');

  if (error) {
    console.error('regenerate_join_code error:', error);

    // Map database errors to user-friendly messages
    if (error.message?.includes('Only the organization OWNER')) {
      return { error: orgActions.errors.onlyOwnerCanRegenerate };
    }
    if (error.message?.includes('Organization was not found')) {
      return { error: orgActions.errors.orgNotFound };
    }

    return { error: orgActions.errors.regenerateFailed };
  }

  revalidatePath('/owner');
  return { success: true, join_code: newCode };
}

/**
 * Send a foreman invite (OWNER only)
 */
export async function sendForemanInvite(email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  if (!email || !email.trim()) {
    return { error: orgActions.errors.inviteEmailRequired };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { error: orgActions.errors.inviteInvalidEmail };
  }

  // Get user's account and verify they're an OWNER
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id) {
    return { error: orgActions.errors.orgNotFound };
  }

  if (account.role !== 'OWNER') {
    return { error: orgActions.errors.onlyOwnerCanInviteForeman };
  }

  // Create invite token (UUID)
  const inviteToken = crypto.randomUUID();

  // Store invite in database
  const { error: insertError } = await supabase.from('invites').insert({
    token: inviteToken,
    email: normalizedEmail,
    role: 'FOREMAN',
    org_id: account.org_id,
  });

  if (insertError) {
    console.error('Insert invite error:', insertError);
    return { error: orgActions.errors.inviteSendFailed };
  }

  // TODO: Send email with invite link (e.g., /invite/{token})
  return { success: true, message: orgActions.success.inviteSent };
}

/**
 * Send a crew invite (FOREMAN only)
 */
export async function sendCrewInvite(email: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  if (!email || !email.trim()) {
    return { error: orgActions.errors.inviteEmailRequired };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return { error: orgActions.errors.inviteInvalidEmail };
  }

  // Get user's account and verify they're a FOREMAN
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id) {
    return { error: orgActions.errors.orgNotFound };
  }

  if (account.role !== 'FOREMAN') {
    return { error: orgActions.errors.onlyForemanCanInviteCrew };
  }

  // Create invite token (UUID)
  const inviteToken = crypto.randomUUID();

  // Store invite in database
  const { error: insertError } = await supabase.from('invites').insert({
    token: inviteToken,
    email: normalizedEmail,
    role: 'CREW',
    org_id: account.org_id,
  });

  if (insertError) {
    console.error('Insert invite error:', insertError);
    return { error: orgActions.errors.inviteSendFailed };
  }

  // TODO: Send email with invite link (e.g., /invite/{token})
  return { success: true, message: orgActions.success.inviteSent };
}

/**
 * Claim an invite and join the organization
 */
export async function claimInvite(token: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  if (!token || !token.trim()) {
    return { error: orgActions.errors.invalidInviteToken };
  }

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token.trim())
    .single();

  if (inviteError || !invite) {
    return { error: orgActions.errors.inviteNotFound };
  }

  // Check if already claimed
  if (invite.claimed_at) {
    return { error: orgActions.errors.inviteAlreadyClaimed };
  }

  // Check expiration (if you have an expires_at field)
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: orgActions.errors.inviteExpired };
  }

  // Assign role and join org
  const { error: updateError } = await supabase.from('accounts').upsert(
    {
      id: user.id,
      org_id: invite.org_id,
      role: invite.role,
    },
    { onConflict: 'id' },
  );

  if (updateError) {
    console.error('Update account error:', updateError);
    return { error: orgActions.errors.claimInviteFailed };
  }

  // Mark invite as claimed
  const { error: claimError } = await supabase
    .from('invites')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', invite.id);

  if (claimError) {
    console.error('Claim invite error:', claimError);
    return { error: orgActions.errors.claimInviteFailed };
  }

  revalidatePath('/');
  return {
    success: true,
    message: orgActions.success.inviteClaimed,
    role: invite.role,
  };
}

/**
 * Get organization details with members (for owner dashboard)
 */
export async function getOrganizationDetails() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  // Get user's account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id) {
    return { error: orgActions.errors.orgNotFound };
  }

  // Get organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', account.org_id)
    .single();

  if (orgError || !org) {
    return { error: orgActions.errors.orgNotFound };
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('accounts')
    .select('id, email, name, role, created_at')
    .eq('org_id', account.org_id)
    .order('created_at', { ascending: true });

  if (membersError) {
    console.error('Members fetch error:', membersError);
    return { error: orgActions.errors.orgNotFound };
  }

  return {
    organization: org,
    members: members || [],
    currentUserRole: account.role,
  };
}

/**
 * Get crew members for foreman dashboard
 */
export async function getCrewMembers() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  // Get user's account and verify they're a FOREMAN
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id) {
    return { error: orgActions.errors.orgNotFound };
  }

  if (account.role !== 'FOREMAN') {
    return { error: 'Only foremen can view crew members.' };
  }

  // Get all crew members in the org
  const { data: crew, error: crewError } = await supabase
    .from('accounts')
    .select('id, email, name, created_at')
    .eq('org_id', account.org_id)
    .eq('role', 'CREW')
    .order('created_at', { ascending: true });

  if (crewError) {
    console.error('Crew fetch error:', crewError);
    return { error: 'Failed to fetch crew members.' };
  }

  return { crew: crew || [] };
}

/**
 * Update user's profile name
 * Uses the update_my_profile() database function
 */
export async function updateMyProfile(name: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: orgActions.errors.notAuthenticated };
  }

  if (!name || !name.trim()) {
    return { error: 'Name is required.' };
  }

  // Call the database workflow function
  const { error } = await supabase.rpc('update_my_profile', {
    name: name.trim(),
  });

  if (error) {
    console.error('update_my_profile error:', error);
    return { error: orgActions.errors.profileUpdateFailed };
  }

  revalidatePath('/');
  return { success: true, message: orgActions.success.profileUpdated };
}

/**
 * Get invite details (for invite claim page)
 */
export async function getInviteDetails(token: string) {
  const supabase = await createClient();

  if (!token || !token.trim()) {
    return { error: orgActions.errors.invalidInviteToken };
  }

  // Get invite without requiring auth for preview
  const { data: invite, error } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token.trim())
    .single();

  if (error || !invite) {
    return { error: orgActions.errors.inviteNotFound };
  }

  // Check if already claimed
  if (invite.claimed_at) {
    return { error: orgActions.errors.inviteAlreadyClaimed };
  }

  // Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: orgActions.errors.inviteExpired };
  }

  return { invite };
}
