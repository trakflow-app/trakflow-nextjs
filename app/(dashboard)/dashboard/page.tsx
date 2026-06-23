import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { RECENT_PROJECTS_LIMIT } from '@/constants/components/dashboard/dashboard-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import { getRecentServerProjects } from '@/lib/dal/projects-server';

/**
 * Shared dashboard tab for all organization roles.
 */
export default async function DashboardPage() {
  const { account } = await requireOrgMember();
  const projects = await getRecentServerProjects(
    account.org_id as string,
    RECENT_PROJECTS_LIMIT,
  );

  return <DashboardOverview projects={projects} />;
}
