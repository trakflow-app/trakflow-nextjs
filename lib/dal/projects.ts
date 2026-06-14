import { createClient } from '@/lib/supabase/client';
import { type Database } from '@/lib/types/database.types';

const PROJECTS_SELECT_COLUMNS = 'id, project_name';
const PROJECTS_LIST_SELECT_COLUMNS =
  'id, org_id, project_name, status, start_date, end_date, budget_amount, created_at';

/**
 * Minimal project shape used by forms that only need project identity.
 */
export type ProjectOption = {
  id: string;
  name: string;
};

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectTool = Database['public']['Tables']['tools']['Row'];
export type ProjectMaterial = Database['public']['Tables']['materials']['Row'];
export type OrgMember = Database['public']['Tables']['accounts']['Row'];
export type ProjectDetailTool = Pick<
  ProjectTool,
  'condition' | 'id' | 'name' | 'status' | 'tag_number'
>;
export type ProjectDetailMaterial = Pick<
  ProjectMaterial,
  'id' | 'low_stock_threshold' | 'name' | 'unit_cost' | 'unit_qty'
>;
export type ProjectTeamMember = Pick<OrgMember, 'id' | 'name' | 'role'>;

/**
 * Loads the current user's organization id.
 */
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: account, error } = await supabase
    .from('accounts')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return account?.org_id ?? null;
}

/**
 * Fetches projects for a specific organization.
 */
export async function fetchProjectsForOrg(
  orgId: string,
): Promise<ProjectOption[]> {
  const supabase = createClient();

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
 * Fetches projects for the provided organization or the current user's org.
 */
export async function getProjects(
  orgId?: string | null,
): Promise<ProjectRow[]> {
  const supabase = createClient();
  const resolvedOrgId = orgId ?? (await getCurrentOrgId());

  if (!resolvedOrgId) return [];

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_SELECT_COLUMNS)
    .eq('org_id', resolvedOrgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches one project by id.
 */
export async function getProjectById(
  projectId: string,
  orgId?: string | null,
): Promise<ProjectRow | null> {
  const supabase = createClient();

  let query = supabase
    .from('projects')
    .select(PROJECTS_LIST_SELECT_COLUMNS)
    .eq('id', projectId);

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query.single();

  if (error) throw error;

  return data;
}

/**
 * Fetches tools assigned to a project.
 */
export async function getProjectTools(
  projectId: string,
  orgId?: string | null,
): Promise<ProjectTool[]> {
  const supabase = createClient();

  let query = supabase
    .from('tools')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches materials assigned to a project.
 */
export async function getProjectMaterials(
  projectId: string,
  orgId?: string | null,
): Promise<ProjectMaterial[]> {
  const supabase = createClient();

  let query = supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (orgId) {
    query = query.eq('org_id', orgId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches organization members for project pages.
 */
export async function getOrgMembers(
  orgId?: string | null,
): Promise<OrgMember[]> {
  const supabase = createClient();
  const resolvedOrgId = orgId ?? (await getCurrentOrgId());

  if (!resolvedOrgId) return [];

  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, email, role, org_id, created_at')
    .eq('org_id', resolvedOrgId)
    .order('name', { ascending: true });

  if (error) throw error;

  return data ?? [];
}
