'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  claimInviteAction,
  type ClaimActionState,
} from '@/app/join/[token]/actions';
import { CLAIM_ACTION_MESSAGES } from '@/locales/app/join/[token]/action-locales';

/**
 * Props for the ClaimInviteForm component.
 */
interface ClaimInviteFormProps {
  token: string;
}

/**
 * Form that submits a token to claim an org invite.
 * Displays an error if the token is invalid or expired.
 */
export default function ClaimInviteForm({ token }: ClaimInviteFormProps) {
  const [state, formAction, isPending] = useActionState<
    ClaimActionState,
    FormData
  >(claimInviteAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? CLAIM_ACTION_MESSAGES.acceptingButton
          : CLAIM_ACTION_MESSAGES.acceptButton}
      </Button>
    </form>
  );
}
