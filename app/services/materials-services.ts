'use server';

import {
  createClient as createSupabaseAdminClient,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import { type MaterialUI } from '@/lib/types/materials-types';
import { type Database } from '@/lib/types/database.types';
import { materialsTable } from '@/locales/components/materials/materials-table-locales';

const MATERIAL_SERVICE_ERRORS = {
  invalidProject: 'The selected project does not belong to your organization',
  missingServerConfig: 'Missing Supabase server configuration',
  permissionDenied: 'You do not have permission to manage materials',
};

const MATERIAL_MANAGER_ROLES = ['OWNER', 'FOREMAN'] as const;

/**
 * Creates a Supabase admin client for server-side material writes.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(MATERIAL_SERVICE_ERRORS.missingServerConfig);
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Ensures the current org member can mutate materials for the requested org.
 */
async function requireMaterialManager(orgId?: string | null) {
  const { account } = await requireOrgMember();
  const resolvedOrgId = orgId ?? account.org_id;
  const canManageMaterials =
    account.org_id === resolvedOrgId &&
    MATERIAL_MANAGER_ROLES.includes(
      account.role as (typeof MATERIAL_MANAGER_ROLES)[number],
    );

  if (!canManageMaterials || !resolvedOrgId) {
    throw new Error(MATERIAL_SERVICE_ERRORS.permissionDenied);
  }

  return resolvedOrgId;
}

/**
 * Verifies that a material assignment targets a project in the same organization.
 */
async function requireProjectInOrganization(
  adminSupabase: SupabaseClient<Database>,
  projectId: string | null | undefined,
  orgId: string,
): Promise<void> {
  if (!projectId) {
    return;
  }

  const { data, error } = await adminSupabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(MATERIAL_SERVICE_ERRORS.invalidProject);
  }
}

/**
 * Adds stock to an existing material with the same name in the same project
 * (or org inventory), or creates a new material if none exists, via the
 * `merge_or_create_material` RPC. The merge (summing `unit_qty`, averaging
 * `unit_cost` by quantity) happens atomically in Postgres so two concurrent
 * calls for the same material can't silently overwrite each other.
 */
export async function mergeOrCreateMaterial(params: {
  projectId: string | null;
  name: string;
  quantity: number;
  unitCost: number;
  lowStockThreshold: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('merge_or_create_material', {
    p_project_id: params.projectId,
    p_name: params.name,
    p_quantity: params.quantity,
    p_unit_cost: params.unitCost,
    p_low_stock_threshold: params.lowStockThreshold,
  });

  if (error) throw new Error(error.message);

  return data;
}

/**
 * Function that record the log consumption of the materials
 */
export async function logMaterialUsageAction(params: {
  materialId: string;
  projectId: string;
  quantityUsed: number;
  notes?: string;
}) {
  const supabase = await createClient();

  // Call the Postgres function defined in your schema
  const { data, error } = await supabase.rpc('log_material_usage', {
    material_id: params.materialId,
    project_id: params.projectId,
    quantity_used: params.quantityUsed,
    notes: params.notes ?? undefined,
  });

  if (error) throw new Error(error.message);

  revalidatePath(MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH);

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
  await requireMaterialManager(params.orgId);

  const data = await mergeOrCreateMaterial({
    projectId: params.projectId || null,
    name: params.name,
    quantity: params.quantity,
    unitCost: params.unitCost,
    lowStockThreshold: params.lowStockThreshold,
  });

  revalidatePath(MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH);

  return data;
}

/**
 * Updates an existing material inventory item.
 */
export async function updateMaterialAction(params: {
  id?: string;
  materialId?: string;
  orgId?: string;
  name: string;
  projectId?: string | null;
  quantity: number;
  unitCost: number;
  lowStockThreshold?: number;
  minQuantity?: number;
}): Promise<MaterialUI> {
  const materialId = params.id ?? params.materialId;
  const lowStockThreshold = params.lowStockThreshold ?? params.minQuantity;

  if (!materialId) {
    throw new Error('Material id is required');
  }

  if (lowStockThreshold === undefined) {
    throw new Error('Low stock threshold is required');
  }

  const orgId = await requireMaterialManager(params.orgId);
  const adminSupabase = createAdminClient();

  await requireProjectInOrganization(adminSupabase, params.projectId, orgId);

  const updateValues: Database['public']['Tables']['materials']['Update'] = {
    name: params.name,
    unit_qty: params.quantity,
    unit_cost: params.unitCost,
    low_stock_threshold: lowStockThreshold,
  };

  if (params.projectId !== undefined) {
    updateValues.project_id = params.projectId || null;
  }

  const { data, error } = await adminSupabase
    .from('materials')
    .update(updateValues)
    .eq('id', materialId)
    .eq('org_id', orgId)
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

  revalidatePath(MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH);

  return {
    id: data.id,
    name: data.name,
    projectId: data.project_id,
    projectName:
      data.projects?.project_name || materialsTable.orgInventoryLabel,
    quantity: data.unit_qty,
    minQuantity: data.low_stock_threshold,
    unitCost: data.unit_cost,
    totalValue: data.unit_qty * data.unit_cost,
  };
}
