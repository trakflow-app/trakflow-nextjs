import 'server-only';

import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import type {
  ProjectCrewRow,
  ProjectDetailMaterial,
  ProjectDetailTool,
  ProjectListFilters,
  ProjectListResult,
  ProjectManagerRow,
  ProjectOption,
  ProjectTeamMember,
} from '@/lib/dal/projects';
import type { Database, Json } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type ProjectManagerPageProject = ProjectManagerRow;

const PROJECTS_SELECT_COLUMNS = 'id, project_name';
const PROJECTS_LIST_WITHOUT_BUDGET_SELECT_COLUMNS =
  'id, org_id, project_name, status, start_date, end_date, created_at';
const PROJECT_DETAIL_TOOLS_SELECT_COLUMNS =
  'id, tag_number, name, status, condition';
const PROJECT_DETAIL_MATERIALS_SELECT_COLUMNS =
  'id, name, unit_qty, unit_cost, low_stock_threshold';
const PROJECT_TEAM_SELECT_COLUMNS = 'id, name, role';
const PROJECT_BUDGET_ACCESS_ERROR =
  'Project budget access requires an organization manager.';
const PROJECT_BUDGET_READER_ROLES = ['OWNER', 'FOREMAN'] as const;

type ProjectReadOptions = {
  includeBudget?: boolean;
};

type ProjectManagerReadOptions = {
  includeBudget: true;
};

type ProjectPageReadOptions = {
  includeBudget?: boolean;
};

type ProjectManagerPageReadOptions = {
  includeBudget: true;
};

/**
 * Verifies that the current authenticated account can read project budgets for the requested organization.
 */
async function requireProjectBudgetReader(orgId: string) {
  const { account } = await requireOrgMember();
  const canReadBudget =
    account.org_id === orgId &&
    PROJECT_BUDGET_READER_ROLES.includes(
      account.role as (typeof PROJECT_BUDGET_READER_ROLES)[number],
    );

  if (!canReadBudget) {
    throw new Error(PROJECT_BUDGET_ACCESS_ERROR);
  }
}

/**
 * Fetches project rows with budget fields through the DB-enforced manager boundary.
 */
async function getProjectManagerRows(params: {
  limit?: number;
  orgId: string;
  projectId?: string;
}): Promise<ProjectManagerRow[]> {
  await requireProjectBudgetReader(params.orgId);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_project_manager_rows', {
    result_limit: params.limit,
    target_org_id: params.orgId,
    target_project_id: params.projectId,
  });

  if (error) throw error;

  return data ?? [];
}

/**
 * Maps the manager-only paginated RPC project payload into the client project shape.
 */
function mapProjectManagerPageRow(
  project: ProjectManagerPageProject,
): ProjectManagerRow {
  return {
    budget_amount: project.budget_amount,
    created_at: project.created_at,
    end_date: project.end_date,
    id: project.id,
    org_id: project.org_id,
    project_name: project.project_name,
    start_date: project.start_date,
    status: project.status,
  };
}

/**
 * Maps the JSON projects payload from the manager page RPC.
 */
function mapProjectManagerPageProjects(projects: Json): ProjectManagerRow[] {
  if (!Array.isArray(projects)) return [];

  return (projects as unknown as ProjectManagerPageProject[]).map(
    mapProjectManagerPageRow,
  );
}

/**
 * Fetches one budget-aware projects page through the DB-enforced manager boundary.
 */
async function getProjectManagerPage(
  orgId: string,
  filters: ProjectListFilters,
): Promise<ProjectListResult> {
  await requireProjectBudgetReader(orgId);

  const supabase = await createClient();
  const pageStartIndex = (filters.page - 1) * filters.pageSize;
  const statusFilter =
    filters.status === 'all' ? null : (filters.status as ProjectStatus);
  const { data, error } = await supabase
    .rpc('get_project_manager_page', {
      page_limit: filters.pageSize,
      page_offset: pageStartIndex,
      search_query: filters.search,
      status_filter: statusFilter,
      target_org_id: orgId,
    })
    .single();

  if (error) throw error;

  const projects = mapProjectManagerPageProjects(data.projects);
  const totalCount = data.total_count;

  return {
    projects,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / filters.pageSize)),
  };
}

/**
 * Fetches project options for selectors in the current organization.
 */
export async function getProjectsForOrg(
  orgId: string,
): Promise<ProjectOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('project_name', { ascending: true });

  if (error) throw error;

  return (data || []).map((project) => ({
    id: project.id,
    name: project.project_name,
  }));
}

/**
 * Fetches all project list rows for the projects page.
 */
export function getServerProjects(
  orgId: string,
  options: ProjectManagerReadOptions,
): Promise<ProjectManagerRow[]>;
export function getServerProjects(
  orgId: string,
  options?: ProjectReadOptions,
): Promise<ProjectCrewRow[]>;
export async function getServerProjects(
  orgId: string,
  options: ProjectReadOptions = {},
): Promise<ProjectCrewRow[] | ProjectManagerRow[]> {
  const includeBudget = options.includeBudget ?? false;

  if (includeBudget) {
    return getProjectManagerRows({ orgId });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_WITHOUT_BUDGET_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches a paginated projects page for an organization.
 */
export function getServerProjectsPage(
  orgId: string,
  filters: ProjectListFilters,
  options: ProjectManagerPageReadOptions,
): Promise<ProjectListResult>;
export function getServerProjectsPage(
  orgId: string,
  filters: ProjectListFilters,
  options?: ProjectPageReadOptions,
): Promise<ProjectListResult>;
export async function getServerProjectsPage(
  orgId: string,
  filters: ProjectListFilters,
  options: ProjectPageReadOptions = {},
): Promise<ProjectListResult> {
  if (options.includeBudget) {
    return getProjectManagerPage(orgId, filters);
  }

  const supabase = await createClient();
  const pageStartIndex = (filters.page - 1) * filters.pageSize;
  const pageEndIndex = pageStartIndex + filters.pageSize - 1;
  let query = supabase
    .from('projects')
    .select(PROJECTS_LIST_WITHOUT_BUDGET_SELECT_COLUMNS, { count: 'exact' })
    .eq('org_id', orgId);

  if (filters.search) {
    query = query.ilike('project_name', `%${filters.search}%`);
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status as ProjectStatus);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(pageStartIndex, pageEndIndex);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    projects: data ?? [],
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / filters.pageSize)),
  };
}

/**
 * Fetches only the newest projects needed by dashboard summary cards.
 */
export function getRecentServerProjects(
  orgId: string,
  limit: number,
  options: ProjectManagerReadOptions,
): Promise<ProjectManagerRow[]>;
export function getRecentServerProjects(
  orgId: string,
  limit: number,
  options?: ProjectReadOptions,
): Promise<ProjectCrewRow[]>;
export async function getRecentServerProjects(
  orgId: string,
  limit: number,
  options: ProjectReadOptions = {},
): Promise<ProjectCrewRow[] | ProjectManagerRow[]> {
  const includeBudget = options.includeBudget ?? false;

  if (includeBudget) {
    return getProjectManagerRows({ limit, orgId });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_WITHOUT_BUDGET_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches one project by id while keeping the query scoped to the organization.
 */
export function getServerProjectById(
  projectId: string,
  orgId: string,
  options: ProjectManagerReadOptions,
): Promise<ProjectManagerRow | null>;
export function getServerProjectById(
  projectId: string,
  orgId: string,
  options?: ProjectReadOptions,
): Promise<ProjectCrewRow | null>;
export async function getServerProjectById(
  projectId: string,
  orgId: string,
  options: ProjectReadOptions = {},
): Promise<ProjectCrewRow | ProjectManagerRow | null> {
  const includeBudget = options.includeBudget ?? false;

  if (includeBudget) {
    const projects = await getProjectManagerRows({ orgId, projectId });

    return projects[0] ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_WITHOUT_BUDGET_SELECT_COLUMNS)
    .eq('id', projectId)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Fetches tools assigned to a project for the project detail page.
 */
export async function getServerProjectTools(
  projectId: string,
  orgId: string,
): Promise<ProjectDetailTool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select(PROJECT_DETAIL_TOOLS_SELECT_COLUMNS)
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches materials assigned to a project for the project detail page.
 */
export async function getServerProjectMaterials(
  projectId: string,
  orgId: string,
): Promise<ProjectDetailMaterial[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('materials')
    .select(PROJECT_DETAIL_MATERIALS_SELECT_COLUMNS)
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches organization members for the project team section.
 */
export async function getServerOrgMembers(
  orgId: string,
): Promise<ProjectTeamMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select(PROJECT_TEAM_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) throw error;

  return data ?? [];
}
