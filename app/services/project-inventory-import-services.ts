'use server';

import {
  createClient as createSupabaseAdminClient,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  importMaterialRowSchema,
  importToolRowSchema,
} from '@/lib/validations/project-inventory-import-validations';
import { TOOLS_MANAGEMENT } from '@/constants/components/tools/tools-constants';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import type { Database } from '@/lib/types/database.types';

type InventoryManagerRole = 'OWNER' | 'FOREMAN';

const INVENTORY_MANAGER_ROLES = [
  'OWNER',
  'FOREMAN',
] as const satisfies readonly InventoryManagerRole[];

const PROJECT_INVENTORY_IMPORT_ERRORS = {
  permissionDenied: 'You do not have permission to import tools or materials.',
  invalidProject: 'The selected project does not belong to your organization.',
  missingServerConfig: 'Missing Supabase server configuration',
  invalidToolRow: 'This tool row is missing a required value.',
  invalidMaterialRow: 'This material row is missing a required value.',
};

export type ImportToolRowPayload = {
  id: string;
  name: string;
  status: string;
  condition: string;
  notes?: string | null;
};

export type ImportMaterialRowPayload = {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
};

export type ImportRowResult = {
  id: string;
  entity: 'tool' | 'material';
  success: boolean;
  error?: string;
};

export type ImportProjectInventoryResult = {
  error?: string;
  results?: ImportRowResult[];
  toolsCreated?: number;
  materialsCreated?: number;
};

/**
 * Creates a Supabase admin client for server-side material writes.
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(PROJECT_INVENTORY_IMPORT_ERRORS.missingServerConfig);
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifies that the target project belongs to the caller's organization.
 */
async function requireProjectInOrganization(
  adminSupabase: SupabaseClient<Database>,
  projectId: string | null,
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
    throw new Error(PROJECT_INVENTORY_IMPORT_ERRORS.invalidProject);
  }
}

/**
 * Creates tools and materials from a reviewed import draft.
 * Rows are inserted one at a time so a bad row does not block the rest of the batch.
 */
export async function importProjectInventoryAction(params: {
  projectId: string | null;
  tools: ImportToolRowPayload[];
  materials: ImportMaterialRowPayload[];
}): Promise<ImportProjectInventoryResult> {
  const { account } = await requireOrgMember();

  if (
    !INVENTORY_MANAGER_ROLES.includes(account.role as InventoryManagerRole)
  ) {
    return { error: PROJECT_INVENTORY_IMPORT_ERRORS.permissionDenied };
  }

  const orgId = account.org_id as string;
  const adminSupabase = createAdminClient();

  try {
    await requireProjectInOrganization(adminSupabase, params.projectId, orgId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : PROJECT_INVENTORY_IMPORT_ERRORS.invalidProject,
    };
  }

  const supabase = await createClient();
  const results: ImportRowResult[] = [];
  let toolsCreated = 0;
  let materialsCreated = 0;

  for (const toolRow of params.tools) {
    const parsed = importToolRowSchema.safeParse(toolRow);

    if (!parsed.success) {
      results.push({
        id: toolRow.id,
        entity: 'tool',
        success: false,
        error: PROJECT_INVENTORY_IMPORT_ERRORS.invalidToolRow,
      });
      continue;
    }

    const toolInsert = {
      org_id: orgId,
      name: parsed.data.name,
      // The database trigger assigns tag_number from the org counter.
      status: parsed.data.status,
      condition: parsed.data.condition,
      project_id: params.projectId,
      notes: parsed.data.notes || null,
    } as Database['public']['Tables']['tools']['Insert'];

    const { error } = await supabase.from('tools').insert(toolInsert);

    if (error) {
      results.push({
        id: toolRow.id,
        entity: 'tool',
        success: false,
        error: error.message,
      });
      continue;
    }

    toolsCreated += 1;
    results.push({ id: toolRow.id, entity: 'tool', success: true });
  }

  for (const materialRow of params.materials) {
    const parsed = importMaterialRowSchema.safeParse(materialRow);

    if (!parsed.success) {
      results.push({
        id: materialRow.id,
        entity: 'material',
        success: false,
        error: PROJECT_INVENTORY_IMPORT_ERRORS.invalidMaterialRow,
      });
      continue;
    }

    const { error } = await adminSupabase.from('materials').insert({
      org_id: orgId,
      name: parsed.data.name,
      project_id: params.projectId,
      unit_qty: parsed.data.quantity,
      unit_cost: parsed.data.unitCost,
      low_stock_threshold: parsed.data.lowStockThreshold,
    });

    if (error) {
      results.push({
        id: materialRow.id,
        entity: 'material',
        success: false,
        error: error.message,
      });
      continue;
    }

    materialsCreated += 1;
    results.push({ id: materialRow.id, entity: 'material', success: true });
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  revalidatePath(MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH);

  if (params.projectId) {
    revalidatePath(`/projects/${params.projectId}`);
  }

  return { results, toolsCreated, materialsCreated };
}
