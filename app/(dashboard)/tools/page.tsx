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
function getToolFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ToolListFilters {
  const status =
    getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.status) ??
    TOOLS_MANAGEMENT.FILTERS.ALL;
  const type =
    getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.type) ??
    TOOLS_MANAGEMENT.FILTERS.ALL;

  return {
    page: getPositiveInteger(
      getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.page),
      TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
    ),
    pageSize: getPositiveInteger(
      getSearchParamValue(searchParams, TOOLS_MANAGEMENT.QUERY_PARAMS.pageSize),
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
 * Tools page that fetches organization tools and renders inventory summaries.
 */
export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const canManageToolRecords = canManageTools(account.role);
  const filters = getToolFilters(resolvedSearchParams);
  const [toolsResult, projects, stats] = await Promise.all([
    getTools(orgId, filters),
    getToolProjects(orgId),
    getToolStats(orgId),
  ]);

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
