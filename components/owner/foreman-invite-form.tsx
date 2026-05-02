'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  inviteForemanAction,
  type InviteActionState,
} from '@/app/(dashboard)/owner/actions';
import { FOREMAN_INVITE_FORM_MESSAGES } from '@/locales/components/owner/foreman-invite-form-locales';

/**
 * Form that lets an owner invite a foreman by email address.
 * Wires to the inviteForemanAction server action.
 * Always surfaces the created invite email + claim link so the owner
 * can share it manually during local testing or email delivery failure.
 */
export default function ForemanInviteForm() {
  const [state, formAction, isPending] = useActionState<
    InviteActionState,
    FormData
  >(inviteForemanAction, null);

  // Local state for the copy button confirmation
  const [copied, setCopied] = useState(false);

  function handleCopy(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      // Reset the label after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      {state?.invitedEmail && state?.claimLink && (
        <div className="space-y-2 rounded-md border bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            {FOREMAN_INVITE_FORM_MESSAGES.createdInviteLabel}
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {FOREMAN_INVITE_FORM_MESSAGES.invitedEmailLabel}
              </p>
              <code className="block rounded border bg-white px-2 py-1 text-xs">
                {state.invitedEmail}
              </code>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {FOREMAN_INVITE_FORM_MESSAGES.inviteLinkLabel}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded border bg-white px-2 py-1 text-xs">
                  {state.claimLink}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(state.claimLink!)}
                >
                  {copied
                    ? FOREMAN_INVITE_FORM_MESSAGES.linkCopiedButton
                    : FOREMAN_INVITE_FORM_MESSAGES.copyLinkButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 p-4 text-sm text-green-800"
        >
          {FOREMAN_INVITE_FORM_MESSAGES.successMessage}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">{FOREMAN_INVITE_FORM_MESSAGES.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={FOREMAN_INVITE_FORM_MESSAGES.emailPlaceholder}
          disabled={isPending}
          aria-invalid={Boolean(state?.error)}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending
          ? FOREMAN_INVITE_FORM_MESSAGES.submittingButton
          : FOREMAN_INVITE_FORM_MESSAGES.submitButton}
      </Button>
    </form>
  );
}
