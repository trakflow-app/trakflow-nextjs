import { redirect } from 'next/navigation';
import { ProjectsList } from '@/components/projects/projects-list';
import { requireOrgMember } from '@/lib/dal/auth';
import { getServerProjectsPage } from '@/lib/dal/projects-server';
import {
  PROJECT_STATUS_VALUES,
  PROJECTS_MANAGEMENT,
} from '@/constants/components/projects/projects-constants';
import type { ProjectListFilters } from '@/lib/dal/projects';
import {
  getAllowedNumber,
  getPositiveInteger,
  getSearchParamValue,
} from '@/lib/query-params';

/**
 * Search params accepted by the projects list page.
 */
type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Converts URL search params into the DAL filter contract.
 */
function getProjectFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ProjectListFilters {
  const status =
    getSearchParamValue(
      searchParams,
      PROJECTS_MANAGEMENT.QUERY_PARAMS.status,
    ) ?? PROJECTS_MANAGEMENT.FILTERS.ALL;

  return {
    page: getPositiveInteger(
      getSearchParamValue(searchParams, PROJECTS_MANAGEMENT.QUERY_PARAMS.page),
      PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
    ),
    pageSize: getAllowedNumber(
      getSearchParamValue(
        searchParams,
        PROJECTS_MANAGEMENT.QUERY_PARAMS.pageSize,
      ),
      Object.values(PROJECTS_MANAGEMENT.PAGE_SIZES),
      PROJECTS_MANAGEMENT.DEFAULTS.PAGE_SIZE,
    ),
    search:
      getSearchParamValue(
        searchParams,
        PROJECTS_MANAGEMENT.QUERY_PARAMS.search,
      ) ?? '',
    status:
      status === PROJECTS_MANAGEMENT.FILTERS.ALL ||
      PROJECT_STATUS_VALUES.includes(
        status as (typeof PROJECT_STATUS_VALUES)[number],
      )
        ? status
        : PROJECTS_MANAGEMENT.FILTERS.ALL,
  };
}

/**
 * Builds a canonical projects list URL from validated filters.
 */
function getProjectsListPath(filters: ProjectListFilters): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set(PROJECTS_MANAGEMENT.QUERY_PARAMS.search, filters.search);
  }

  if (filters.status !== PROJECTS_MANAGEMENT.FILTERS.ALL) {
    params.set(PROJECTS_MANAGEMENT.QUERY_PARAMS.status, filters.status);
  }

  if (filters.page !== PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
    params.set(PROJECTS_MANAGEMENT.QUERY_PARAMS.page, String(filters.page));
  }

  if (filters.pageSize !== PROJECTS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
    params.set(
      PROJECTS_MANAGEMENT.QUERY_PARAMS.pageSize,
      String(filters.pageSize),
    );
  }

  const queryString = params.toString();

  return queryString
    ? `${PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH}?${queryString}`
    : PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH;
}

/**
 * Projects list page with server-loaded filtering and pagination.
 */
export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  // Resolve and validate incoming URL filters before reading project rows.
  const resolvedSearchParams = await searchParams;
  const filters = getProjectFilters(resolvedSearchParams);

  // Server-side data fetching ensures only org members can access this page,
  const { account } = await requireOrgMember();
  // Determine if user can manage projects based on their role, and pass this as a prop for conditional UI in ProjectsList.
  const canManageProjects = PROJECTS_MANAGEMENT.MANAGER_ROLES.includes(
    account.role as (typeof PROJECTS_MANAGEMENT.MANAGER_ROLES)[number],
  );
  // Load only the requested project page instead of sending the full org list to the browser.
  const projectsResult = canManageProjects
    ? await getServerProjectsPage(account.org_id as string, filters, {
        includeBudget: true,
      })
    : await getServerProjectsPage(account.org_id as string, filters);

  // Redirect invalid high page numbers to the final available page.
  if (filters.page > projectsResult.totalPages) {
    redirect(
      getProjectsListPath({
        ...filters,
        page: projectsResult.totalPages,
      }),
    );
  }

  return (
    <ProjectsList
      canManageProjects={canManageProjects}
      filters={filters}
      projects={projectsResult.projects}
      totalPages={projectsResult.totalPages}
    />
  );
}
