import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MaterialUI } from '@/lib/types/materials-types';
import { Database } from '@/lib/types/database.types';
import { materialsTable } from '@/locales/components/materials/materials-table-locales';

const MATERIALS_SELECT_COLUMNS = `
  id,
  project_id,
  name,
  unit_qty,
  unit_cost,
  low_stock_threshold,
  projects (
    project_name
  )
`;

// Define the exact shape Supabase returns from the JOIN
type MaterialWithProject = Database['public']['Tables']['materials']['Row'] & {
  projects: { project_name: string } | null;
};

function mapMaterialRow(material: MaterialWithProject): MaterialUI {
  return {
    id: material.id,
    name: material.name,
    projectId: material.project_id,
    projectName:
      material.projects?.project_name || materialsTable.orgInventoryLabel,
    quantity: material.unit_qty,
    minQuantity: material.low_stock_threshold,
    unitCost: material.unit_cost,
    totalValue: material.unit_qty * material.unit_cost,
  };
}

/**
 * Fetches materials for a specific organization using the server session.
 * Uses the foreign key to 'projects' to get the project_name.
 */
export async function getServerMaterials(
  orgId: string,
  projectId?: string | null,
): Promise<MaterialUI[]> {
  const supabase = await createClient();

  let query = supabase
    .from('materials')
    .select(MATERIALS_SELECT_COLUMNS)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const materialsData = data as unknown as MaterialWithProject[];

  return (materialsData || []).map(mapMaterialRow);
}
