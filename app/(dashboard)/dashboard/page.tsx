import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { requireOrgMember } from '@/lib/dal/auth';
import { getServerProjects } from '@/lib/dal/projects-server';

/**
 * Shared dashboard tab for all organization roles.
 */
export default async function DashboardPage() {
  const { account } = await requireOrgMember();
  const projects = await getServerProjects(account.org_id as string);

  return <DashboardOverview projects={projects} />;
}
