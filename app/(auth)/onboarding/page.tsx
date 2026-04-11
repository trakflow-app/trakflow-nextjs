import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/auth/actions';
import CreateOrgForm from '@/components/organization/create-org-form';
import JoinOrgForm from '@/components/org/join-org-form';

export default async function OnboardingPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  // User already has org and role - route to dashboard
  if (profile.organization_id && profile.role) {
    redirect(`/${profile.role}`);
  }

  // User needs to create or join org
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to TrakFlow</h1>
          <p className="mt-2 text-gray-600">Let's get you set up</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <CreateOrgForm />
          <JoinOrgForm />
        </div>
      </div>
    </div>
  );
}
