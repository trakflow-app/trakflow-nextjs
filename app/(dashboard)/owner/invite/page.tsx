import { requireRole } from '@/lib/dal/auth';
import { getOrgJoinCode } from '@/lib/dal/orgs';
import { listPendingForemanInvites } from '@/lib/dal/invites';
import { getAppUrl } from '@/lib/email/resend';
import ForemanInviteForm from '@/components/owner/foreman-invite-form';
import { OWNER_INVITE_PAGE_MESSAGES } from '@/locales/app/(dashboard)/owner/invite/page-locales';

/**
 * Owner-only page for adding team members.
 * Displays the crew join code, foreman invite form, and pending invite links.
 */
export default async function OwnerInvitePage() {
  // requireRole handles auth check, role check, and redirect — no repetition needed
  await requireRole('OWNER');

  const [joinCode, pendingForemanInvites] = await Promise.all([
    getOrgJoinCode(),
    listPendingForemanInvites(),
  ]);
  const appUrl = getAppUrl();

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-10">
      <h1 className="text-2xl font-bold">
        {OWNER_INVITE_PAGE_MESSAGES.pageTitle}
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {OWNER_INVITE_PAGE_MESSAGES.joinCodeSection.heading}
        </h2>
        <p className="text-sm text-gray-600">
          {OWNER_INVITE_PAGE_MESSAGES.joinCodeSection.description}
        </p>
        {joinCode ? (
          <p className="rounded-lg border bg-gray-50 px-4 py-3 font-mono text-xl tracking-widest">
            {joinCode}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            {OWNER_INVITE_PAGE_MESSAGES.joinCodeSection.noCode}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {OWNER_INVITE_PAGE_MESSAGES.foremanInviteSection.heading}
        </h2>
        <p className="text-sm text-gray-600">
          {OWNER_INVITE_PAGE_MESSAGES.foremanInviteSection.description}
        </p>
        <ForemanInviteForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection.heading}
        </h2>
        <p className="text-sm text-gray-600">
          {OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection.description}
        </p>
        {pendingForemanInvites.length ? (
          <ul className="space-y-3">
            {pendingForemanInvites.map((invite) => {
              const claimLink = `${appUrl}/join/${invite.token}`;

              return (
                <li
                  key={invite.token}
                  className="space-y-2 rounded-lg border bg-gray-50 p-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {
                        OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection
                          .emailLabel
                      }
                    </p>
                    <code className="block rounded border bg-white px-2 py-1 text-xs">
                      {invite.invited_email ??
                        OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection
                          .missingEmail}
                    </code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {
                        OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection
                          .linkLabel
                      }
                    </p>
                    <a
                      href={claimLink}
                      className="block truncate rounded border bg-white px-2 py-1 text-xs text-blue-600 underline"
                    >
                      {claimLink}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            {OWNER_INVITE_PAGE_MESSAGES.pendingInvitesSection.noInvites}
          </p>
        )}
      </section>
    </div>
  );
}
