import { getAuthenticatedUser } from '@/lib/auth/actions';
import { logout } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function OnboardingPage() {
  // User needs to create/join org  // Ensure the user is authenticated
  const user = await getAuthenticatedUser();
  // Get the user's name from user_metadata
  const username = user.user_metadata?.full_name || 'User';
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form action={logout}>
        <Button variant="outline" type="submit">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </form>

      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          {/** TODO: Need to clean up later */}
          <h1 className="text-3xl font-bold">Welcome to TrakFlow</h1>
          <p className="mt-2 text-gray-600">Lets get you set up</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <h1>Welcome to Onboarding</h1>
          <h1>Hello, {username}!</h1>
          <p>TODO: We will guide you through the next steps soon.</p>
        </div>
      </div>
    </div>
  );
}
