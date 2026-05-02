import { requireRole } from '@/lib/dal/auth';
import { getOrgJoinCode } from '@/lib/dal/orgs';
import { FOREMAN_INVITE_PAGE_MESSAGES } from '@/locales/app/(dashboard)/foreman/invite/page-locales';

/**
 * Foreman-only page for sharing the crew join code.
 * Foreman can view and share the code but cannot invite foremen by email.
 */
export default async function ForemanInvitePage() {
  // requireRole handles auth check, role check, and redirect — no repetition needed
  await requireRole('FOREMAN');

  const joinCode = await getOrgJoinCode();

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-10">
      <h1 className="text-2xl font-bold">
        {FOREMAN_INVITE_PAGE_MESSAGES.pageTitle}
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {FOREMAN_INVITE_PAGE_MESSAGES.joinCodeSection.heading}
        </h2>
        <p className="text-sm text-gray-600">
          {FOREMAN_INVITE_PAGE_MESSAGES.joinCodeSection.description}
        </p>
        {joinCode ? (
          <p className="rounded-lg border bg-gray-50 px-4 py-3 font-mono text-xl tracking-widest">
            {joinCode}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            {FOREMAN_INVITE_PAGE_MESSAGES.joinCodeSection.noCode}
          </p>
        )}
      </section>
    </div>
  );
}
