import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/types/database.types';
import { TOOLS_PAGE_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

export type ToolStatus = Database['public']['Enums']['tool_status'];
export type ToolCondition = Database['public']['Enums']['tool_condition'];
export type ToolAssignmentType = 'INVENTORY' | 'ASSIGNED';

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
};

type ToolWithProject = Database['public']['Tables']['tools']['Row'] & {
  projects: { project_name: string } | null;
};

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

  return (toolsData ?? []).map((tool) => ({
    id: tool.id,
    name: tool.name,
    tagNumber: tool.tag_number,
    status: tool.status,
    condition: tool.condition,
    projectId: tool.project_id,
    projectName: tool.projects?.project_name ?? TOOLS_PAGE_TEXT.inventoryType,
    type: tool.project_id ? 'ASSIGNED' : 'INVENTORY',
    notes: tool.notes,
    imagePath: tool.image_path,
  }));
}
