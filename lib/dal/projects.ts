import { createClient } from '@/lib/supabase/client';

const PROJECTS_SELECT_COLUMNS = 'id, project_name';

/**
 * Minimal project shape used by forms that only need project identity.
 */
export type ProjectOption = {
  id: string;
  name: string;
};

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
