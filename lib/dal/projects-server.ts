import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  OrgMember,
  ProjectMaterial,
  ProjectOption,
  ProjectRow,
  ProjectTool,
} from '@/lib/dal/projects';

const PROJECTS_SELECT_COLUMNS = 'id, project_name';
const PROJECTS_LIST_SELECT_COLUMNS =
  'id, org_id, project_name, status, start_date, end_date, budget_amount, created_at';

/**
 * Fetches projects for a specific organization using the server session.
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
 * Fetches project list rows for a specific organization using the server session.
 */
export async function getServerProjects(orgId: string): Promise<ProjectRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches one project by id using the server session.
 */
export async function getServerProjectById(
  projectId: string,
  orgId: string,
): Promise<ProjectRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(PROJECTS_LIST_SELECT_COLUMNS)
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
 * Fetches tools assigned to a project using the server session.
 */
export async function getServerProjectTools(
  projectId: string,
  orgId: string,
): Promise<ProjectTool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches materials assigned to a project using the server session.
 */
export async function getServerProjectMaterials(
  projectId: string,
  orgId: string,
): Promise<ProjectMaterial[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetches organization members using the server session.
 */
export async function getServerOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, email, role, org_id, created_at')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) throw error;

  return data ?? [];
}
