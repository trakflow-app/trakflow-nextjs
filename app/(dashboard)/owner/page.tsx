import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Placeholder owner dashboard.
 */
export default async function OwnerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role;

  if (role !== 'OWNER') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="mt-2 text-gray-600">
          This is a placeholder dashboard for the owner role.
        </p>
      </div>
    </div>
  );
}
