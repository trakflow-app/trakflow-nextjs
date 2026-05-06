// docs/plan.md specifies Zod for all validations in lib/validations/.
import { z } from 'zod';
import { INVITE_VALIDATION_MESSAGES } from '@/locales/lib/validations/invite-locales';

/**
 * Validation schema for the foreman invite form.
 * Used server-side in createForemanInvite and client-side for form feedback.
 */
export const INVITE_FOREMAN_SCHEMA = z.object({
  email: z
    .string()
    .min(1, INVITE_VALIDATION_MESSAGES.emailRequired)
    .email(INVITE_VALIDATION_MESSAGES.emailInvalid),
});

/** Inferred type for the foreman invite form values. */
export type InviteForemanInput = z.infer<typeof INVITE_FOREMAN_SCHEMA>;
