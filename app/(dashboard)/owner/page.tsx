import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';
import { requireRole } from '@/lib/dal/auth';
import { OWNER_DASHBOARD_MESSAGES } from '@/locales/app/(dashboard)/owner/page-locales';

/**
 * Placeholder owner dashboard.
 */
export default async function OwnerDashboardPage() {
  const { account } = await requireRole('OWNER');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">
          {OWNER_DASHBOARD_MESSAGES.heading}
        </h1>
        <p className="mt-2 text-gray-600">
          {OWNER_DASHBOARD_MESSAGES.greeting} {account.name}!
        </p>
        <p className="mt-2 text-gray-600">
          {OWNER_DASHBOARD_MESSAGES.placeholder}
        </p>
        <div className="mt-6">
          <Link href="/owner/invite">
            <Button variant="outline">
              {OWNER_DASHBOARD_MESSAGES.inviteLink}
            </Button>
          </Link>
        </div>
      </div>
      <form action={logout}>
        <Button variant="outline" type="submit">
          <LogOut className="mr-2 h-4 w-4" />
          {OWNER_DASHBOARD_MESSAGES.logout}
        </Button>
      </form>
    </div>
  );
}
