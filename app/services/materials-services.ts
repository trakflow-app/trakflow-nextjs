'use server';

import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { type MaterialUI } from '@/lib/types/materials-types';
import { type Database } from '@/lib/types/database.types';
import { materialsTable } from '@/locales/components/materials/materials-table-locales';

const MATERIAL_SERVICE_ERRORS = {
  missingServerConfig: 'Missing Supabase server configuration',
  notAuthenticated: 'You must be signed in to manage materials',
  accountNotFound: 'Account details could not be loaded',
  permissionDenied: 'You do not have permission to manage materials',
};

const MATERIAL_MANAGER_ROLES = ['OWNER', 'FOREMAN'];

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
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(MATERIAL_SERVICE_ERRORS.notAuthenticated);
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id || !account?.role) {
    throw new Error(MATERIAL_SERVICE_ERRORS.accountNotFound);
  }

  const canManageMaterials =
    account.org_id === params.orgId &&
    MATERIAL_MANAGER_ROLES.includes(account.role);

  if (!canManageMaterials) {
    throw new Error(MATERIAL_SERVICE_ERRORS.permissionDenied);
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
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

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(MATERIAL_SERVICE_ERRORS.notAuthenticated);
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (accountError || !account?.org_id || !account?.role) {
    throw new Error(MATERIAL_SERVICE_ERRORS.accountNotFound);
  }

  const orgId = params.orgId ?? account.org_id;
  const canManageMaterials =
    account.org_id === orgId && MATERIAL_MANAGER_ROLES.includes(account.role);

  if (!canManageMaterials) {
    throw new Error(MATERIAL_SERVICE_ERRORS.permissionDenied);
  }

  const adminSupabase = createAdminClient();

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

  return {
    id: data.id,
    name: data.name,
    projectId: data.project_id,
    projectName: data.projects?.project_name || materialsTable.orgInventoryLabel,
    quantity: data.unit_qty,
    minQuantity: data.low_stock_threshold,
    unitCost: data.unit_cost,
    totalValue: data.unit_qty * data.unit_cost,
  };
}
