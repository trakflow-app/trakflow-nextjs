import { ProjectsList } from '@/components/projects/projects-list';
import { requireOrgMember } from '@/lib/dal/auth';
import { getServerProjects } from '@/lib/dal/projects-server';
import { PROJECTS_MANAGEMENT } from '@/constants/components/projects/projects-constants';

/**
 * Projects list page — fetches all org projects server-side and passes them
 * to the ProjectsList client component for search, filter, and navigation.
 */
export default async function ProjectsPage() {
  // Server-side data fetching ensures only org members can access this page,
  const { account } = await requireOrgMember();
  // Determine if user can manage projects based on their role, and pass this as a prop for conditional UI in ProjectsList.
  const canManageProjects = PROJECTS_MANAGEMENT.MANAGER_ROLES.includes(
    account.role as (typeof PROJECTS_MANAGEMENT.MANAGER_ROLES)[number],
  );
  // and that they see the most up-to-date list of projects without client-side loading states.
  const projects = canManageProjects
    ? await getServerProjects(account.org_id as string, {
        includeBudget: true,
      })
    : await getServerProjects(account.org_id as string);

  // Render the ProjectsList component with the fetched projects and permissions.
  return (
    <ProjectsList canManageProjects={canManageProjects} projects={projects} />
  );
}
