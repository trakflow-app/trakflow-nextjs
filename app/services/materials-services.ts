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
