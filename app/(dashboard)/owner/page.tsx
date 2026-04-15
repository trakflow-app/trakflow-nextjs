import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';

/**
 * Placeholder owner dashboard.
 */
export default async function OwnerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .select('role, name')
    .eq('id', user.id)
    .single();

  console.log('Owner page - Account error:', error);
  console.log('Owner page - Account data:', account);
  console.log('Owner page - Account role:', account?.role);
  console.log('Owner page - Role check (should be OWNER):', account?.role);

  if (error) {
    console.error('Error fetching account:', error);
    redirect('/');
  }

  if (account?.role !== 'OWNER') {
    console.log(
      'Redirecting because role is not OWNER. Actual role:',
      account?.role,
    );
    redirect('/');
  }

  const username = account?.name;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="mt-2 text-gray-600">Hello, {username}!</p>
        <p className="mt-2 text-gray-600">
          This is a placeholder dashboard for the owner role.
        </p>
      </div>
      <form action={logout}>
        <Button variant="outline" type="submit">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </form>
    </div>
  );
}
