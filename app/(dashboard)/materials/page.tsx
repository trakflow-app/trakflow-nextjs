import { MaterialsClient } from '@/components/materials/materials-client';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import {
  getServerMaterialsPage,
  getServerMaterialStats,
  type MaterialListFilters,
} from '@/lib/dal/materials';
import { getProjectsForOrg } from '@/lib/dal/projects-server';

/**
 * Search params accepted by the materials list page.
 */
type MaterialsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Reads a single query string value from Next's search params shape.
 */
function getSearchParamValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parses positive numeric query params while preserving a safe fallback.
 */
function getPositiveInteger(value: string | undefined, fallback: number) {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

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
    pageSize: getPositiveInteger(
      getSearchParamValue(
        searchParams,
        MATERIALS_MANAGEMENT.QUERY_PARAMS.pageSize,
      ),
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
 * Materials management page with server-loaded inventory and project data.
 */
export default async function MaterialsPage({
  searchParams,
}: MaterialsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const filters = getMaterialFilters(resolvedSearchParams);
  const [materialsResult, materialStats, projects] = await Promise.all([
    getServerMaterialsPage(orgId, filters),
    getServerMaterialStats(orgId),
    getProjectsForOrg(orgId),
  ]);

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
