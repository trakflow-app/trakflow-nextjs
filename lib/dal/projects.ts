import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectTool = Pick<
  Database['public']['Tables']['tools']['Row'],
  'id' | 'name' | 'tag_number' | 'status' | 'condition'
>;
export type ProjectMaterial = Pick<
  Database['public']['Tables']['materials']['Row'],
  'id' | 'name' | 'unit_qty' | 'unit_cost' | 'low_stock_threshold'
>;
export type OrgMember = Pick<
  Database['public']['Tables']['accounts']['Row'],
  'id' | 'name' | 'role'
>;

// ─── Error messages ───────────────────────────────────────────────────────────

const PROJECTS_ERROR_MESSAGES = {
  failedToLoadProject: 'Failed to load project.',
  failedToLoadProjects: 'Failed to load projects.',
  failedToLoadTools: 'Failed to load project tools.',
  failedToLoadMaterials: 'Failed to load project materials.',
  failedToLoadMembers: 'Failed to load org members.',
} as const;

function createProjectsError(message: string): Error {
  return new Error(message);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all projects for the caller's org, ordered by creation date descending.
 */
export async function getProjects(orgId: string): Promise<ProjectRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, project_name, start_date, end_date, budget_amount, status, created_at, org_id',
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw createProjectsError(PROJECTS_ERROR_MESSAGES.failedToLoadProjects);
  }

  return data ?? [];
}

/**
 * Fetches a single project by id, scoped to the caller's org.
 * Returns null if not found or not in the org — caller should invoke notFound().
 */
export async function getProjectById(
  id: string,
  orgId: string,
): Promise<ProjectRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw createProjectsError(PROJECTS_ERROR_MESSAGES.failedToLoadProject);
  }

  return data;
}

/**
 * Fetches all tools assigned to a specific project, scoped to the caller's org.
 */
export async function getProjectTools(
  projectId: string,
  orgId: string,
): Promise<ProjectTool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select('id, name, tag_number, status, condition')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('tag_number', { ascending: true });

  if (error) {
    throw createProjectsError(PROJECTS_ERROR_MESSAGES.failedToLoadTools);
  }

  return data ?? [];
}

/**
 * Fetches all materials assigned to a specific project, scoped to the caller's org.
 */
export async function getProjectMaterials(
  projectId: string,
  orgId: string,
): Promise<ProjectMaterial[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('materials')
    .select('id, name, unit_qty, unit_cost, low_stock_threshold')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    throw createProjectsError(PROJECTS_ERROR_MESSAGES.failedToLoadMaterials);
  }

  return data ?? [];
}

/**
 * Fetches all onboarded members of the org (accounts with a non-null role).
 */
export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, role')
    .eq('org_id', orgId)
    .not('role', 'is', null)
    .order('name', { ascending: true });

  if (error) {
    throw createProjectsError(PROJECTS_ERROR_MESSAGES.failedToLoadMembers);
  }

  return data ?? [];
}
