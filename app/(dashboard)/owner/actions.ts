'use server';

import { revalidatePath } from 'next/cache';
import { createForemanInvite } from '@/lib/dal/invites';
import { INVITE_FOREMAN_SCHEMA } from '@/lib/validations/invites';
import {
  getResendClient,
  getResendFromEmail,
  getAppUrl,
} from '@/lib/email/resend';
import { buildForemanInviteEmail } from '@/lib/email/templates/foreman-invite';
import { OWNER_INVITE_ACTION_MESSAGES } from '@/locales/app/(dashboard)/owner/invite/action-locales';

/**
 * State returned by the invite server action.
 * claimLink is always returned so the owner can manually share it
 * during local testing or if the email provider fails.
 */
export type InviteActionState = {
  error?: string;
  success?: boolean;
  invitedEmail?: string;
  claimLink?: string;
} | null;

/**
 * Validates the submitted email, creates a foreman invite in the DB,
 * and sends the invite email via Resend.
 */
export async function inviteForemanAction(
  _prevState: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const raw = { email: formData.get('email') as string };
  const result = INVITE_FOREMAN_SCHEMA.safeParse(raw);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  let token: string;

  try {
    token = await createForemanInvite(result.data.email);
  } catch {
    return { error: OWNER_INVITE_ACTION_MESSAGES.inviteFailed };
  }

  const claimLink = `${getAppUrl()}/join/${token}`;
  const { subject, html } = buildForemanInviteEmail({ claimLink });

  try {
    await getResendClient().emails.send({
      from: getResendFromEmail(),
      to: result.data.email,
      subject,
      html,
    });
  } catch {
    revalidatePath('/owner/invite');

    // Email failed but the invite token exists in the DB. Return the claim
    // link so the owner can copy and share it manually as a recovery path.
    return {
      error: OWNER_INVITE_ACTION_MESSAGES.emailFailed,
      invitedEmail: result.data.email,
      claimLink,
    };
  }

  revalidatePath('/owner/invite');

  return { success: true, invitedEmail: result.data.email, claimLink };
}
