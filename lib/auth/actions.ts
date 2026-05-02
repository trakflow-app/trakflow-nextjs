'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const INTERNAL_REDIRECT_PREFIX = '/';
const PROTOCOL_RELATIVE_PREFIX = '//';

// Shared return type for auth actions
export type ActionState = {
  error?: string;
} | null;

/**
 * Returns a safe internal redirect path from form data or null.
 */
function getSafeRedirectPath(formData: FormData): string | null {
  const redirectTo = formData.get('redirect');

  if (
    typeof redirectTo !== 'string' ||
    !redirectTo.startsWith(INTERNAL_REDIRECT_PREFIX) ||
    redirectTo.startsWith(PROTOCOL_RELATIVE_PREFIX)
  ) {
    return null;
  }

  return redirectTo;
}

/**
 * Signup logic where anybody can signup
 * using their validated email address, fullname, password
 * Redirect to the email confirmation page
 */
export async function signup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

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

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  // Refresh cached layout data after signup
  revalidatePath('/', 'layout');

  // If the user arrived from an invite link (/join/[token]), the page passes
  // a ?redirect param through a hidden input so we send them back there after
  // signup instead of always going to /onboarding.
  const safeRedirect = getSafeRedirectPath(formData);

  redirect(safeRedirect ?? '/onboarding');
}

/**
 * Logs in an existing user and redirects by role.
 * If a redirect param is present in the form data, uses that instead.
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

  // Refresh cached layout data after login
  revalidatePath('/', 'layout');

  // If the user arrived from an invite link (/join/[token]), the login page
  // receives ?redirect via searchParams and passes it as a hidden input.
  // We send them back there instead of the role-based dashboard.
  const safeRedirect = getSafeRedirectPath(formData);

  if (safeRedirect) redirect(safeRedirect);

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
  // Read the currently signed-in user
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
