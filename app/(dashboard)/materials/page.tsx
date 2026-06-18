import { redirect } from 'next/navigation';
import { MaterialsClient } from '@/components/materials/materials-client';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import {
  getServerMaterialsPage,
  getServerMaterialStats,
  type MaterialListFilters,
} from '@/lib/dal/materials';
import { getProjectsForOrg } from '@/lib/dal/projects-server';
import {
  getAllowedNumber,
  getPositiveInteger,
  getSearchParamValue,
} from '@/lib/query-params';

/**
 * Search params accepted by the materials list page.
 */
type MaterialsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Converts URL search params into the DAL filter contract.
 */
function getMaterialFilters(
  searchParams: Record<string, string | string[] | undefined>,
): MaterialListFilters {
  return {
    page: getPositiveInteger(
      getSearchParamValue(searchParams, MATERIALS_MANAGEMENT.QUERY_PARAMS.page),
      MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
    ),
    pageSize: getAllowedNumber(
      getSearchParamValue(
        searchParams,
        MATERIALS_MANAGEMENT.QUERY_PARAMS.pageSize,
      ),
      Object.values(MATERIALS_MANAGEMENT.PAGE_SIZES),
      MATERIALS_MANAGEMENT.DEFAULTS.PAGE_SIZE,
    ),
    project:
      getSearchParamValue(
        searchParams,
        MATERIALS_MANAGEMENT.QUERY_PARAMS.project,
      ) ?? MATERIALS_MANAGEMENT.FILTERS.ALL_PROJECTS,
    search:
      getSearchParamValue(
        searchParams,
        MATERIALS_MANAGEMENT.QUERY_PARAMS.search,
      ) ?? '',
  };
}

/**
 * Builds a canonical materials list URL from validated filters.
 */
function getMaterialsListPath(filters: MaterialListFilters): string {
  // Start with an empty query and add only non-default filters.
  const params = new URLSearchParams();

  // Preserve the current search text.
  if (filters.search) {
    params.set(MATERIALS_MANAGEMENT.QUERY_PARAMS.search, filters.search);
  }

  // Preserve a non-default project filter.
  if (filters.project !== MATERIALS_MANAGEMENT.FILTERS.ALL_PROJECTS) {
    params.set(MATERIALS_MANAGEMENT.QUERY_PARAMS.project, filters.project);
  }

  // Omit page one to keep the canonical URL short.
  if (filters.page !== MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
    params.set(MATERIALS_MANAGEMENT.QUERY_PARAMS.page, String(filters.page));
  }

  // Omit the default page size to keep the canonical URL short.
  if (filters.pageSize !== MATERIALS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
    params.set(
      MATERIALS_MANAGEMENT.QUERY_PARAMS.pageSize,
      String(filters.pageSize),
    );
  }

  // Convert the validated filters into the final URL.
  const queryString = params.toString();

  return queryString
    ? `${MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH}?${queryString}`
    : MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH;
}

/**
 * Materials management page with server-loaded inventory and project data.
 */
export default async function MaterialsPage({
  searchParams,
}: MaterialsPageProps) {
  // Resolve and validate the incoming URL filters.
  const resolvedSearchParams = await searchParams;

  // Load the authenticated organization before querying inventory.
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const filters = getMaterialFilters(resolvedSearchParams);

  // Load list rows, statistics, and project options in parallel.
  const [materialsResult, materialStats, projects] = await Promise.all([
    getServerMaterialsPage(orgId, filters),
    getServerMaterialStats(orgId),
    getProjectsForOrg(orgId),
  ]);

  // Redirect invalid high page numbers to the final available page.
  if (filters.page > materialsResult.totalPages) {
    redirect(
      getMaterialsListPath({
        ...filters,
        page: materialsResult.totalPages,
      }),
    );
  }

  return (
    <MaterialsClient
      filters={filters}
      initialMaterials={materialsResult.materials}
      materialStats={materialStats}
      orgProjects={projects}
      orgId={orgId}
      totalPages={materialsResult.totalPages}
    />
  );
}
