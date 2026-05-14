import { createClient } from '@/lib/supabase/client';

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
 * Creates a new material inventory item.
 */
export async function createMaterialAction(params: {
  orgId: string;
  name: string;
  projectId?: string | null;
  quantity: number;
  unitCost: number;
  lowStockThreshold: number;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('materials')
    .insert({
      org_id: params.orgId,
      name: params.name,
      project_id: params.projectId || null,
      unit_qty: params.quantity,
      unit_cost: params.unitCost,
      low_stock_threshold: params.lowStockThreshold,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

