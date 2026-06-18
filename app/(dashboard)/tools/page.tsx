import { redirect } from 'next/navigation';
import { ToolCreateButton } from '@/components/tools/tool-create-button';
import { ToolsList } from '@/components/tools/tools-list';
import { ToolsStatsGrid } from '@/components/tools/tools-stats-grid';
import {
  TOOL_STATUS_VALUES,
  TOOLS_MANAGEMENT,
} from '@/constants/components/tools/tools-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import {
  getToolProjects,
  getTools,
  getToolStats,
  type ToolListFilters,
} from '@/lib/dal/tools';
import type { Database } from '@/lib/types/database.types';
import {
  getAllowedNumber,
  getPositiveInteger,
  getSearchParamValue,
} from '@/lib/query-params';
import { TOOLS_PAGE_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

/**
 * Roles allowed to create, update, and delete tool inventory records.
 */
type ToolManagerRole = 'OWNER' | 'FOREMAN';

/**
 * Search params accepted by the tools list page.
 */
type ToolsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TOOL_MANAGER_ROLES = [
  'OWNER',
  'FOREMAN',
] as const satisfies readonly ToolManagerRole[];

/**
 * Checks whether the account role can mutate tool inventory records.
 */
function canManageTools(role: Database['public']['Enums']['user_role'] | null) {
  return TOOL_MANAGER_ROLES.includes(role as ToolManagerRole);
}

/**
 * Converts URL search params into the DAL filter contract.
 */
function getToolFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ToolListFilters {
  // Validate the requested tool status against known filter values below.
  const status =
    getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.status) ??
    TOOLS_MANAGEMENT.FILTERS.ALL;

  // Validate the derived assignment type against known filter values below.
  const type =
    getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.type) ??
    TOOLS_MANAGEMENT.FILTERS.ALL;

  return {
    page: getPositiveInteger(
      getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.page),
      TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
    ),
    pageSize: getAllowedNumber(
      getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.pageSize),
      Object.values(TOOLS_MANAGEMENT.PAGE_SIZES),
      TOOLS_MANAGEMENT.DEFAULTS.PAGE_SIZE,
    ),
    project:
      getSearchParamValue(
        searchParams,
        TOOLS_MANAGEMENT.QUERY_PARAMS.project,
      ) ?? TOOLS_MANAGEMENT.FILTERS.ALL,
    search:
      getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.search) ??
      '',
    status:
      status === TOOLS_MANAGEMENT.FILTERS.ALL ||
      TOOL_STATUS_VALUES.includes(status as (typeof TOOL_STATUS_VALUES)[number])
        ? status
        : TOOLS_MANAGEMENT.FILTERS.ALL,
    type:
      type === 'INVENTORY' || type === 'ASSIGNED'
        ? type
        : TOOLS_MANAGEMENT.FILTERS.ALL,
  };
}

/**
 * Builds a canonical tools list URL from validated filters.
 */
function getToolsListPath(filters: ToolListFilters): string {
  // Start with an empty query and add only non-default filters.
  const params = new URLSearchParams();

  // Preserve the current search text.
  if (filters.search) {
    params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.search, filters.search);
  }

  // Preserve a non-default status filter.
  if (filters.status !== TOOLS_MANAGEMENT.FILTERS.ALL) {
    params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.status, filters.status);
  }

  // Preserve a non-default assignment type.
  if (filters.type !== TOOLS_MANAGEMENT.FILTERS.ALL) {
    params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.type, filters.type);
  }

  // Preserve a non-default project filter.
  if (filters.project !== TOOLS_MANAGEMENT.FILTERS.ALL) {
    params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.project, filters.project);
  }

  // Omit page one to keep the canonical URL short.
  if (filters.page !== TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
    params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.page, String(filters.page));
  }

  // Omit the default page size to keep the canonical URL short.
  if (filters.pageSize !== TOOLS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
    params.set(
      TOOLS_MANAGEMENT.QUERY_PARAMS.pageSize,
      String(filters.pageSize),
    );
  }

  // Convert the validated filters into the final URL.
  const queryString = params.toString();

  return queryString
    ? `${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}?${queryString}`
    : TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH;
}

/**
 * Tools page that fetches organization tools and renders inventory summaries.
 */
export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  // Resolve and validate the incoming URL filters.
  const resolvedSearchParams = await searchParams;

  // Load the authenticated organization before querying inventory.
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const canManageToolRecords = canManageTools(account.role);
  const filters = getToolFilters(resolvedSearchParams);

  // Load list rows, filter options, and summary cards in parallel.
  const [toolsResult, projects, stats] = await Promise.all([
    getTools(orgId, filters),
    getToolProjects(orgId),
    getToolStats(orgId),
  ]);

  // Redirect invalid high page numbers to the final available page.
  if (filters.page > toolsResult.totalPages) {
    redirect(
      getToolsListPath({
        ...filters,
        page: toolsResult.totalPages,
      }),
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {TOOLS_PAGE_TEXT.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {TOOLS_PAGE_TEXT.subtitle}
            </p>
          </div>
          {canManageToolRecords ? (
            <ToolCreateButton projects={projects} />
          ) : null}
        </div>

        <ToolsStatsGrid stats={stats} />
        <ToolsList
          filters={filters}
          tools={toolsResult.tools}
          projects={projects}
          totalPages={toolsResult.totalPages}
          canManageTools={canManageToolRecords}
        />
      </div>
    </div>
  );
}
