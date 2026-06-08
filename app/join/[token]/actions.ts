'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CLAIM_INVITE_ERROR_DETAILS, claimInvite } from '@/lib/dal/invites';
import { CLAIM_ACTION_MESSAGES } from '@/locales/app/join/[token]/action-locales';
import { DASHBOARD_ROUTE } from '@/constants/components/dashboard/dashboard-constants';

/**
 * State returned by the claim invite server action.
 */
export type ClaimActionState = {
  error?: string;
} | null;

/**
 * Maps internal claim failures to UI-safe copy for the invite page.
 */
function getClaimErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return CLAIM_ACTION_MESSAGES.unexpectedError;
  }

  if (error.message === 'Authentication required.') {
    return CLAIM_ACTION_MESSAGES.authenticationRequired;
  }

  if (error.message === CLAIM_INVITE_ERROR_DETAILS.alreadyInOrganization) {
    return CLAIM_ACTION_MESSAGES.alreadyInOrganization;
  }

  if (error.message === CLAIM_INVITE_ERROR_DETAILS.emailMismatch) {
    return CLAIM_ACTION_MESSAGES.emailMismatch;
  }

  if (error.message === CLAIM_INVITE_ERROR_DETAILS.invalidExpiredOrUsed) {
    return CLAIM_ACTION_MESSAGES.invalidToken;
  }

  return CLAIM_ACTION_MESSAGES.unexpectedError;
}

/**
 * Claims an org invite using the token from the form.
 * On success, reads the account role and redirects to the correct dashboard.
 */
export async function claimInviteAction(
  _prevState: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const token = formData.get('token') as string;

  try {
    await claimInvite(token);
  } catch (error) {
    return { error: getClaimErrorMessage(error) };
  }

  revalidatePath('/owner/invite');

  // Re-read the account to get the role that was just assigned by the claim
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: account } = await supabase
    .from('accounts')
    .select('role')
    .eq('id', user.id)
    .single();

  if (account?.role === 'FOREMAN') redirect(DASHBOARD_ROUTE);
  if (account?.role === 'CREW') redirect(DASHBOARD_ROUTE);

  redirect('/onboarding');
}
