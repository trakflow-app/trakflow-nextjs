import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClaimInviteForm from '@/components/join/claim-invite-form';
import { CLAIM_PAGE_MESSAGES } from '@/locales/app/join/[token]/page-locales';

/**
 * Props for the JoinPage dynamic route.
 */
interface JoinPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Public-facing page for claiming an org invite via a token link.
 * Requires the user to be authenticated — redirects to signup if not.
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Foreman invites are usually used by brand-new users, so default the
  // token flow to signup first. Existing users can switch to login there
  // without losing the invite redirect.
  if (!user) {
    redirect(`/signup?redirect=${encodeURIComponent(`/join/${token}`)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">{CLAIM_PAGE_MESSAGES.heading}</h1>
        <p className="text-sm text-gray-600">
          {CLAIM_PAGE_MESSAGES.description}
        </p>
        <ClaimInviteForm token={token} />
      </div>
    </div>
  );
}
