import { FOREMAN_INVITE_EMAIL_MESSAGES } from '@/locales/lib/email/foreman-invite-locales';

/**
 * Input values required to build the foreman invite email.
 */
export interface ForemanInviteEmailTemplateParams {
  claimLink: string;
}

/**
 * The email payload returned by the foreman invite template helper.
 */
export interface ForemanInviteEmailTemplate {
  subject: string;
  html: string;
}

/**
 * Builds the subject and HTML body for a foreman invite email.
 */
export function buildForemanInviteEmail({
  claimLink,
}: ForemanInviteEmailTemplateParams): ForemanInviteEmailTemplate {
  const html = `
    <html lang="en">
      <body>
        <h1>${FOREMAN_INVITE_EMAIL_MESSAGES.heading}</h1>
        <p>${FOREMAN_INVITE_EMAIL_MESSAGES.intro}</p>
        <p>
          <a href="${claimLink}">${FOREMAN_INVITE_EMAIL_MESSAGES.ctaLabel}</a>
        </p>
        <p>${FOREMAN_INVITE_EMAIL_MESSAGES.fallbackLabel}</p>
        <p>${claimLink}</p>
        <p>${FOREMAN_INVITE_EMAIL_MESSAGES.outro}</p>
      </body>
    </html>
  `.trim();

  return {
    subject: FOREMAN_INVITE_EMAIL_MESSAGES.subject,
    html,
  };
}
