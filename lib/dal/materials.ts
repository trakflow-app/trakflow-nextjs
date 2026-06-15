import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MaterialUI } from '@/lib/types/materials-types';
import type { Database } from '@/lib/types/database.types';
import { materialsTable } from '@/locales/components/materials/materials-table-locales';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';

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

/**
 * Material row shape returned by Supabase when joining project names.
 */
type MaterialWithProject = Database['public']['Tables']['materials']['Row'] & {
  projects: { project_name: string } | null;
};

/**
 * Server-side filters supported by the materials list query.
 */
export type MaterialListFilters = {
  page: number;
  pageSize: number;
  project: string;
  search: string;
};

/**
 * Paginated material rows returned to the materials page.
 */
export type MaterialListResult = {
  materials: MaterialUI[];
  totalCount: number;
  totalPages: number;
};

/**
 * Summary numbers displayed above the materials table.
 */
export type MaterialStats = {
  inventoryValue: number;
  lowStockCount: number;
  totalMaterials: number;
};

/**
 * Maps a database material row into the UI shape used by table and modals.
 */
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
 * Fetches a paginated materials page for an organization.
 */
export async function getServerMaterialsPage(
  orgId: string,
  filters: MaterialListFilters,
): Promise<MaterialListResult> {
  const supabase = await createClient();
  const pageStartIndex = (filters.page - 1) * filters.pageSize;
  const pageEndIndex = pageStartIndex + filters.pageSize - 1;
  let query = supabase
    .from('materials')
    .select(MATERIALS_SELECT_COLUMNS, { count: 'exact' })
    .eq('org_id', orgId);

  if (filters.project !== MATERIALS_MANAGEMENT.FILTERS.ALL_PROJECTS) {
    query = query.eq('project_id', filters.project);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(pageStartIndex, pageEndIndex);

  if (error) throw error;

  const materialsData = data as unknown as MaterialWithProject[];
  const totalCount = count ?? 0;

  return {
    materials: (materialsData || []).map(mapMaterialRow),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / filters.pageSize)),
  };
}

/**
 * Fetches material summary metrics without loading every row into the UI.
 */
export async function getServerMaterialStats(
  orgId: string,
): Promise<MaterialStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('materials')
    .select('unit_qty, unit_cost, low_stock_threshold')
    .eq('org_id', orgId);

  if (error) throw error;

  return (data ?? []).reduce<MaterialStats>(
    (stats, material) => ({
      inventoryValue:
        stats.inventoryValue + material.unit_qty * material.unit_cost,
      lowStockCount:
        stats.lowStockCount +
        (material.unit_qty <= material.low_stock_threshold ? 1 : 0),
      totalMaterials: stats.totalMaterials + 1,
    }),
    {
      inventoryValue: 0,
      lowStockCount: 0,
      totalMaterials: 0,
    },
  );
}
