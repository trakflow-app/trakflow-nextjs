import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types/database.types';
import { TOOLS_PAGE_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';
import { createSignedToolImageUrls } from '@/lib/storage/tool-images';

export type ToolStatus = Database['public']['Enums']['tool_status'];
export type ToolCondition = Database['public']['Enums']['tool_condition'];
export type ToolAssignmentType = 'INVENTORY' | 'ASSIGNED';

export type ToolListFilters = {
  page: number;
  pageSize: number;
  project: string;
  search: string;
  status: string;
  type: string;
};

export type ToolListResult = {
  tools: ToolRow[];
  totalCount: number;
  totalPages: number;
};

export type ToolStats = {
  availableTools: number;
  checkedOutTools: number;
  serviceTools: number;
  totalTools: number;
};

const TOOL_PROJECT_SELECT_COLUMNS = 'id, project_name';
const TOOLS_WITH_PROJECT_SELECT_COLUMNS = `
  id,
  name,
  tag_number,
  status,
  condition,
  project_id,
  notes,
  image_path,
  projects (
    project_name
  )
`;

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

type ToolWithProject = Pick<
  Database['public']['Tables']['tools']['Row'],
  | 'condition'
  | 'id'
  | 'image_path'
  | 'name'
  | 'notes'
  | 'project_id'
  | 'status'
  | 'tag_number'
> & {
  projects: { project_name: string } | null;
};

/**
 * Maps a tool database row to the UI shape.
 */
function mapToolRow(
  tool: ToolWithProject,
  signedImageUrl: string | null,
): ToolRow {
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
 * Fetches a paginated tools page for an organization.
 */
export async function getTools(
  orgId: string,
  filters: ToolListFilters,
): Promise<ToolListResult> {
  const supabase = await createClient();
  const pageStartIndex = (filters.page - 1) * filters.pageSize;
  const pageEndIndex = pageStartIndex + filters.pageSize - 1;
  let query = supabase
    .from('tools')
    .select(TOOLS_WITH_PROJECT_SELECT_COLUMNS, { count: 'exact' })
    .eq('org_id', orgId);

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status as ToolStatus);
  }

  if (filters.project !== 'all') {
    query =
      filters.project === 'inventory'
        ? query.is('project_id', null)
        : query.eq('project_id', filters.project);
  }

  if (filters.type !== 'all') {
    query =
      filters.type === 'INVENTORY'
        ? query.is('project_id', null)
        : query.not('project_id', 'is', null);
  }

  const { data, error, count } = await query
    .order('tag_number', { ascending: true })
    .range(pageStartIndex, pageEndIndex);

  if (error) {
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  const toolsData = data as unknown as ToolWithProject[];
  const imagePaths = toolsData
    .map((tool) => tool.image_path)
    .filter((imagePath): imagePath is string => Boolean(imagePath));
  const signedImageUrls = await createSignedToolImageUrls(supabase, imagePaths);

  const tools = (toolsData ?? []).map((tool) =>
    mapToolRow(
      tool,
      tool.image_path ? (signedImageUrls.get(tool.image_path) ?? null) : null,
    ),
  );
  const totalCount = count ?? 0;

  return {
    tools,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / filters.pageSize)),
  };
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
 *
 * Detail pages sign the image separately so text content can stream first.
 */
export async function getToolById(
  id: string,
  orgId: string,
): Promise<ToolRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tools')
    .select(TOOLS_WITH_PROJECT_SELECT_COLUMNS)
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  const tool = data as unknown as ToolWithProject;

  return mapToolRow(tool, null);
}

/**
 * Fetches summary counts for the tools inventory.
 */
export async function getToolStats(orgId: string): Promise<ToolStats> {
  // Create an authenticated client so the aggregate view respects tool RLS.
  const supabase = await createClient();

  // Read all tool summary counts from one database aggregate row.
  const { data, error } = await supabase
    .from('tool_inventory_stats')
    .select('available_tools, checked_out_tools, service_tools, total_tools')
    .eq('org_id', orgId)
    .maybeSingle();

  // Surface database or permission failures to the page error boundary.
  if (error) {
    throw new Error(TOOLS_PAGE_TEXT.loadFailed);
  }

  return {
    availableTools: data?.available_tools ?? 0,
    checkedOutTools: data?.checked_out_tools ?? 0,
    serviceTools: data?.service_tools ?? 0,
    totalTools: data?.total_tools ?? 0,
  };
}
