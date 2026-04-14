import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';

/**
 * Placeholder crew dashboard.
 */
export default async function CrewDashboardPage() {
  // Read the currently signed-in user
  const user = await getAuthenticatedUser();
  // Create Supabase client on the server
  const supabase = await createClient();
  // Query the account to check the user's details
  const { data: account, error } = await supabase
    .from('accounts')
    .select('role, name')
    .eq('id', user.id)
    .single();

  if (error || account?.role !== 'CREW') {
    redirect('/');
  }

  const username = account?.name;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Crew Dashboard</h1>
        <p className="mt-2 text-gray-600">Hello, {username}!</p>
        <p className="mt-2 text-gray-600">
          This is a placeholder dashboard for the crew role.
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
