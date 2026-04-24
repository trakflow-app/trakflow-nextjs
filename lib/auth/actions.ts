'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Shared return type for auth actions
export type ActionState = {
  error?: string;
} | null;

/**
 * Signup logic where anybody can signup
 * using their validated email address, fullname, password
 * Redirect to the email confirmation page
 */
export async function signup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Create Supabase client on the server
  const supabase = await createClient();

  // This the data payload for signup
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('full_name') as string,
        role: null,
      },
    },
  };

  // Create the user in Supabase Auth
  const { error } = await supabase.auth.signUp(data);

  // Return the error to the form if signup fails
  if (error) {
    return { error: error.message };
  }

  // Refresh cached layout data after signup
  revalidatePath('/', 'layout');

  // Redirect to the onboarding for org creation
  redirect('/onboarding');
}

/**
 * Foreman signup via invite token.
 * Validates invite, creates user, marks invite as used, redirects to /foreman.
 */
export async function signupForeman(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const inviteToken = formData.get('invite_token') as string;

  // Re-validate using the RPC (Safe & No RLS needed)
  const { data: inviteArray } = await supabase.rpc('get_invite_details', {
    token_input: inviteToken,
  });
  const invite = inviteArray?.[0];

  if (!invite?.is_valid || invite.invited_email !== email) {
    return { error: 'Invalid or mismatched invite.' };
  }

  // Create user in Supabase Auth with metadata
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: fullName,
        role: 'FOREMAN',
        organization_id: invite.org_id,
      },
    },
  });

  if (signupError) return { error: signupError.message };

  const userId = signupData.user?.id;

  if (userId) {
    const { error: rpcError } = await supabase.rpc('mark_invite_used', {
      token_input: inviteToken,
      user_id_input: userId,
    });

    if (rpcError) {
      console.error('Failed to mark invite as used:', rpcError);
    }
  }

  // Revalidate and redirect
  revalidatePath('/', 'layout');
  redirect('/foreman');
}

/**
 * Crew signup with org code validation.
 * Creates a user with role 'CREW' and associates with the org.
 */
export async function signupCrew(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const orgCode = formData.get('org_code') as string;
  const orgId = formData.get('org_id') as string;
  const role = formData.get('role') as string;

  // Verify org code exists and get org ID using RPC function
  const { data: verifiedOrgId, error: orgError } = await supabase.rpc(
    'get_org_id_by_code',
    { join_code_input: orgCode },
  );

  if (orgError || !verifiedOrgId) {
    return { error: 'Invalid organization code.' };
  }

  // Ensure the org_id from form matches the verified one
  if (orgId !== verifiedOrgId) {
    return { error: 'Organization mismatch. Please try again.' };
  }

  // Create user in Supabase Auth with metadata
  const { error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: fullName,
        role: role || 'CREW',
        organization_id: orgId,
      },
    },
  });

  if (signupError) {
    return { error: signupError.message };
  }

  // Revalidate and redirect
  revalidatePath('/', 'layout');
  redirect('/crew');
}

/**
 * Logs in an existing user and redirects by role.
 */
export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Create Supabase client on the server
  const supabase = await createClient();

  // Build the login payload
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Sign the user in
  const { error } = await supabase.auth.signInWithPassword(data);

  // Return the error to the form if login fails
  if (error) {
    return { error: error.message };
  }

  // Read the authenticated user after login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = user?.user_metadata?.role as string | undefined;

  if (!role && user) {
    const { data: account } = await supabase
      .from('accounts')
      .select('role')
      .eq('id', user.id)
      .single();

    role = account?.role as string | undefined;
  }

  // Refresh cached layout data after login
  revalidatePath('/', 'layout');

  // Redirect user to the correct dashboard based on role
  if (role === 'OWNER') redirect('/owner');
  if (role === 'FOREMAN') redirect('/foreman');
  if (role === 'CREW') redirect('/crew');

  // Fallback redirect if no role is found
  redirect('/onboarding');
}

/**
 * Logs out the current user and sends them to login.
 */
export async function logout() {
  // Create Supabase client on the server
  const supabase = await createClient();

  // End the current session
  await supabase.auth.signOut();

  // Refresh cached layout data after logout
  revalidatePath('/', 'layout');

  // Send the user back to the login page
  redirect('/login');
}

/**
 * Helper function to get the authenticated user.
 * Redirects to the login page if no user is found.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Get current user's account (without organization join)
 * This works even when user hasn't joined an org yet
 */
export async function getAccount() {
  // Read the currently signed-in user
  const user = await getAuthenticatedUser();
  // Create Supabase client on the server
  const supabase = await createClient();

  // Load the matching account row by user id
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();

  // Return null if the account lookup fails
  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  // Return the account record
  return account;
}

/**
 * Verifies if the provided org code is valid.
 * Returns { valid: true } if found, otherwise { valid: false }.
 */
export async function verifyOrgCode(
  orgCode: string,
): Promise<{ valid: boolean }> {
  const supabase = await createClient();

  // Call the database function that allows unauthenticated access
  const { data, error } = await supabase.rpc('verify_org_code', {
    join_code_input: orgCode.toUpperCase(),
  });

  return { valid: !!data && !error };
}

/**
 * Validate foreman invite token and return invite details
 */
export async function validateForemanInviteToken(token: string) {
  // Fetch invite from DB
  const supabase = await createClient();

  // Call the new RPC function we created in the migration
  const { data, error } = await supabase.rpc('get_invite_details', {
    token_input: token,
  });

  // RPC returns an array in Supabase JS, so we take the first item
  const invite = data?.[0];

  if (error || !invite || !invite.is_valid) {
    console.error('Validation Error:', error || invite?.error_message);
    return { error: invite?.error_message || 'Invite not found.' };
  }

  return {
    email: invite.invited_email,
    orgId: invite.org_id,
    orgName: invite.org_name,
  };
}

/**
 * Fetches organization name by join code.
 * Used during crew signup verification.
 */
export async function getOrgNameByCode(
  orgCode: string,
): Promise<{ name: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: name, error } = await supabase.rpc('get_org_name_by_code', {
    join_code_input: orgCode,
  });

  if (error || !name) {
    return { name: null, error: 'Failed to load organization details.' };
  }

  return { name, error: null };
}
