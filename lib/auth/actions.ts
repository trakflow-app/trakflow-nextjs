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
        full_name: formData.get('full_name') as string,
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

  // Send the user to the email confirmation page
  redirect('/check-email');
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
 * Get current user's account (without organization join)
 * This works even when user hasn't joined an org yet
 */
export async function getAccount() {
  // Create Supabase client on the server
  const supabase = await createClient();

  // Read the currently signed-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Return null if there is no logged-in user
  if (!user) return null;

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
