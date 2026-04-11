'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionState = {
  error?: string;
} | null;

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
        full_name: formData.get('full_name') as string,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Get current user's account (without organization join)
 * This works even when user hasn't joined an org yet
 */
export async function getAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Don't join with organizations - RLS blocks it when org_id is null
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return account;
}

/**
 * Get account WITH organization details (only works after user has joined)
 */
export async function getAccountWithOrg() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();

  if (accountError || !account) {
    console.error('Error fetching account:', accountError);
    return null;
  }

  // If user has no org, return account without org details
  if (!account.org_id) {
    return account;
  }

  // Fetch organization separately
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', account.org_id)
    .single();

  if (orgError) {
    console.error('Error fetching organization:', orgError);
    return account; // Return account even if org fetch fails
  }

  return {
    ...account,
    organization,
  };
}

export async function checkUserOrg() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false };
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  // If RLS denies access or account doesn't exist, assume no org yet
  if (error || !account) {
    return { authenticated: true, hasOrg: false, role: null };
  }

  return {
    authenticated: true,
    hasOrg: !!account.org_id,
    role: account.role,
  };
}
