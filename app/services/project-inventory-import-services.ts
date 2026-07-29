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
  projectId: string | null;
  name: string;
  status: string;
  condition: string;
  notes?: string | null;
};

export type ImportMaterialRowPayload = {
  id: string;
  projectId: string | null;
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
  toolsSaved?: number;
  materialsSaved?: number;
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
 * Checks which of the given project ids do not belong to the caller's
 * organization, so each row can be validated against its own project_name
 * instead of a single project applied to the whole batch.
 */
async function findProjectIdsOutsideOrganization(
  adminSupabase: SupabaseClient<Database>,
  projectIds: string[],
  orgId: string,
): Promise<Set<string>> {
  if (projectIds.length === 0) {
    return new Set();
  }

  const { data, error } = await adminSupabase
    .from('projects')
    .select('id')
    .eq('org_id', orgId)
    .in('id', projectIds);

  if (error) {
    throw new Error(error.message);
  }

  const validProjectIds = new Set((data ?? []).map((row) => row.id));

  return new Set(projectIds.filter((id) => !validProjectIds.has(id)));
}

/**
 * Creates tools and materials from a reviewed import draft.
 * Rows are inserted one at a time so a bad row does not block the rest of the batch.
 */
export async function importProjectInventoryAction(params: {
  tools: ImportToolRowPayload[];
  materials: ImportMaterialRowPayload[];
}): Promise<ImportProjectInventoryResult> {
  const { account } = await requireOrgMember();

  if (!INVENTORY_MANAGER_ROLES.includes(account.role as InventoryManagerRole)) {
    return { error: PROJECT_INVENTORY_IMPORT_ERRORS.permissionDenied };
  }

  const orgId = account.org_id as string;
  const adminSupabase = createAdminClient();

  const requestedProjectIds = Array.from(
    new Set(
      [...params.tools, ...params.materials]
        .map((row) => row.projectId)
        .filter((projectId): projectId is string => Boolean(projectId)),
    ),
  );

  let invalidProjectIds: Set<string>;

  try {
    invalidProjectIds = await findProjectIdsOutsideOrganization(
      adminSupabase,
      requestedProjectIds,
      orgId,
    );
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
  const touchedProjectIds = new Set<string>();
  let toolsSaved = 0;
  let materialsSaved = 0;

  for (const toolRow of params.tools) {
    if (toolRow.projectId && invalidProjectIds.has(toolRow.projectId)) {
      results.push({
        id: toolRow.id,
        entity: 'tool',
        success: false,
        error: PROJECT_INVENTORY_IMPORT_ERRORS.invalidProject,
      });
      continue;
    }

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
      project_id: toolRow.projectId,
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

    toolsSaved += 1;
    if (toolRow.projectId) {
      touchedProjectIds.add(toolRow.projectId);
    }
    results.push({ id: toolRow.id, entity: 'tool', success: true });
  }

  for (const materialRow of params.materials) {
    if (materialRow.projectId && invalidProjectIds.has(materialRow.projectId)) {
      results.push({
        id: materialRow.id,
        entity: 'material',
        success: false,
        error: PROJECT_INVENTORY_IMPORT_ERRORS.invalidProject,
      });
      continue;
    }

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

    // Atomic on the database side (`merge_or_create_material`), so two rows
    // with the same name in one batch — or a concurrent request elsewhere —
    // merge correctly instead of racing on a JS-side read-then-write.
    const { error } = await supabase.rpc('merge_or_create_material', {
      p_project_id: materialRow.projectId,
      p_name: parsed.data.name,
      p_quantity: parsed.data.quantity,
      p_unit_cost: parsed.data.unitCost,
      p_low_stock_threshold: parsed.data.lowStockThreshold,
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

    materialsSaved += 1;
    if (materialRow.projectId) {
      touchedProjectIds.add(materialRow.projectId);
    }
    results.push({ id: materialRow.id, entity: 'material', success: true });
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  revalidatePath(MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH);

  for (const projectId of touchedProjectIds) {
    revalidatePath(`/projects/${projectId}`);
  }

  return { results, toolsSaved, materialsSaved };
}
