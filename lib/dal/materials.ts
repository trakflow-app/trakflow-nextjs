import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database.types';

// Define the UI type (what the component expects)
export type MaterialUI = {
  id: string;
  name: string;
  projectId: string | null;
  projectName: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  totalValue: number;
  unit: string;
};

// Define the exact shape Supabase returns from the JOIN
type MaterialWithProject = Database['public']['Tables']['materials']['Row'] & {
  projects: { project_name: string } | null;
};

/**
 * Fetches materials for a specific organization.
 * Uses the foreign key to 'projects' to get the project_name.
 */
export async function fetchMaterials(
  orgId: string,
  projectId?: string | null,
): Promise<MaterialUI[]> {
  const supabase = createClient();

  let query = supabase
    .from('materials')
    .select(
      `
      *,
      projects (
        project_name
      )
    `,
    )
    .eq('org_id', orgId);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const materialsData = data as unknown as MaterialWithProject[];

  return (materialsData || []).map((m) => ({
    id: m.id,
    name: m.name,
    projectId: m.project_id,
    projectName: m.projects?.project_name || 'Unassigned',
    quantity: m.unit_qty,
    minQuantity: m.low_stock_threshold,
    unitCost: m.unit_cost,
    totalValue: m.unit_qty * m.unit_cost,
    unit: 'units',
  }));
}
