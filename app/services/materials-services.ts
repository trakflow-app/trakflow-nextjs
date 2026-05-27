import { createClient } from '@/lib/supabase/client';
import { MaterialUI } from '@/lib/dal/materials';

type UpdateMaterialActionParams = {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  minQuantity: number;
};

/**
 * Function that record the log consumption of the materials
 */
export async function logMaterialUsageAction(params: {
  materialId: string;
  projectId: string;
  quantityUsed: number;
  notes?: string;
}) {
  const supabase = createClient();

  // Call the Postgres function defined in your schema
  const { data, error } = await supabase.rpc('log_material_usage', {
    material_id: params.materialId,
    project_id: params.projectId,
    quantity_used: params.quantityUsed,
    notes: params.notes ?? undefined,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Updates a material and returns the shape expected by material UI components.
 */
export async function updateMaterialAction(
  params: UpdateMaterialActionParams,
): Promise<MaterialUI> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('materials')
    .update({
      name: params.name,
      unit_qty: params.quantity,
      unit_cost: params.unitCost,
      low_stock_threshold: params.minQuantity,
    })
    .eq('id', params.id)
    .select(
      `
      *,
      projects (
        project_name
      )
    `,
    )
    .single();

  if (error) throw new Error(error.message);

  const project = data.projects as { project_name: string } | null;

  return {
    id: data.id,
    name: data.name,
    projectId: data.project_id,
    projectName: project?.project_name || 'Unassigned',
    quantity: data.unit_qty,
    minQuantity: data.low_stock_threshold,
    unitCost: data.unit_cost,
    totalValue: data.unit_qty * data.unit_cost,
    unit: 'units',
  };
}
