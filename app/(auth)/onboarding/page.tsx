import { redirect } from 'next/navigation';
import { checkUserOrg } from '@/lib/auth/actions';
import CreateOrgForm from '@/components/organization/create-org-form';
import JoinOrgForm from '@/components/organization/join-org-form';
import { logout } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function OnboardingPage() {
  const result = await checkUserOrg();

  if (!result.authenticated) {
    redirect('/login');
  }

  if (result.hasOrg && result.role) {
    // Redirect server-side before rendering
    if (result.role === 'OWNER') {
      redirect('/owner');
    } else if (result.role === 'FOREMAN') {
      redirect('/foreman');
    } else {
      redirect('/crew');
    }
  }

  // User needs to create/join org
  // TODO: Clean up later
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
          <CreateOrgForm />
          <JoinOrgForm />
        </div>
      </div>
    </div>
  );
}
