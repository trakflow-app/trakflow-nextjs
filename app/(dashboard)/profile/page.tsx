import { ProfileOverview } from '@/components/profile/profile-overview';
import {
  type DashboardUserRole,
  DEFAULT_ORGANIZATION_NAME,
} from '@/constants/components/dashboard/dashboard-constants';
import {
  PROFILE_DATE_FORMAT_OPTIONS,
  PROFILE_DATE_LOCALE,
} from '@/constants/components/profile/profile-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Renders the authenticated user's role-aware profile page.
 */
export default async function ProfilePage() {
  const { account } = await requireOrgMember();
  const supabase = await createClient();
  const [{ data: organization }, { data: authData }] = await Promise.all([
    supabase
      .from('organizations')
      .select('name')
      .eq('id', account.org_id as string)
      .single(),
    supabase.auth.getUser(),
  ]);
  const avatarUrl = authData.user?.user_metadata?.avatar_url;
  const memberSince = new Intl.DateTimeFormat(
    PROFILE_DATE_LOCALE,
    PROFILE_DATE_FORMAT_OPTIONS,
  ).format(new Date(account.created_at));

  return (
    <ProfileOverview
      name={account.name}
      email={account.email}
      organizationName={organization?.name ?? DEFAULT_ORGANIZATION_NAME}
      memberSince={memberSince}
      role={account.role as DashboardUserRole}
      avatarUrl={typeof avatarUrl === 'string' ? avatarUrl : undefined}
    />
  );
}
