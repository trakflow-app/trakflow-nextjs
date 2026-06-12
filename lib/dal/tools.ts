import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types/database.types';
import { TOOLS_PAGE_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';
import { createSignedToolImageUrl } from '@/lib/storage/tool-images';

export type ToolStatus = Database['public']['Enums']['tool_status'];
export type ToolCondition = Database['public']['Enums']['tool_condition'];
export type ToolAssignmentType = 'INVENTORY' | 'ASSIGNED';

const TOOL_PROJECT_SELECT_COLUMNS = 'id, project_name';

export type ToolRow = {
  id: string;
  name: string;
  tagNumber: number;
  status: ToolStatus;
  condition: ToolCondition;
  projectId: string | null;
  projectName: string;
  type: ToolAssignmentType;
  notes: string | null;
  imagePath: string | null;
  imageStoragePath: string | null;
};

export type ToolProjectRow = {
  id: string;
  project_name: string;
};

type ToolWithProject = Database['public']['Tables']['tools']['Row'] & {
  projects: { project_name: string } | null;
};

/**
 * Maps a tool database row to the UI shape with a signed image URL.
 */
async function mapToolRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tool: ToolWithProject,
): Promise<ToolRow> {
  const signedImageUrl = await createSignedToolImageUrl(
    supabase,
    tool.image_path,
  );

  return {
    id: tool.id,
    name: tool.name,
    tagNumber: tool.tag_number,
    status: tool.status,
    condition: tool.condition,
    projectId: tool.project_id,
    projectName: tool.projects?.project_name ?? TOOLS_PAGE_TEXT.inventoryType,
    type: tool.project_id ? 'ASSIGNED' : 'INVENTORY',
    notes: tool.notes,
    imagePath: signedImageUrl,
    imageStoragePath: tool.image_path,
  };
}

/**
 * Fetches all tools for an organization with optional project assignment data.
 */
export async function getTools(orgId: string): Promise<ToolRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select(
      `
      *,
      projects (
        project_name
      )
    `,
    )
    .eq('org_id', orgId)
    .order('tag_number', { ascending: true });

  if (error) {
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  const toolsData = data as unknown as ToolWithProject[];

  return Promise.all(
    (toolsData ?? []).map((tool) => mapToolRow(supabase, tool)),
  );
}

/**
 * Fetches project options used by the tools management surface.
 */
export async function getToolProjects(
  orgId: string,
): Promise<ToolProjectRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(TOOL_PROJECT_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('project_name', { ascending: true });

  if (error) {
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  return data ?? [];
}

/**
 * Fetches a single tool by id, scoped to the caller's organization.
 */
export async function getToolById(
  id: string,
  orgId: string,
): Promise<ToolRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select(
      `
      *,
      projects (
        project_name
      )
    `,
    )
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  return mapToolRow(supabase, data as unknown as ToolWithProject);
}
