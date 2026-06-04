'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  TOOL_CONDITION_VALUES,
  TOOLS_MANAGEMENT,
} from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';
import { TOOLS_ACTION_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolCondition = Database['public']['Enums']['tool_condition'];

/**
 * Active checkout state used by tool management UI.
 */
export type ToolManagementState = {
  activeCheckoutId: string | null;
  activeCheckoutUserName: string | null;
  activeCheckoutSessionName: string | null;
  checkedOutAt: string | null;
  checkoutNotes: string | null;
};

/**
 * Result returned by tool checkout and check-in server actions.
 */
export type ToolManagementActionState = {
  error?: string;
  success?: boolean;
  toolManagementId?: string;
  sessionId?: string;
} | null;

type ActiveToolCheckoutRow = {
  id: string;
  tool_id: string;
  user_id: string;
  session_id: string;
  checked_out: string;
  notes: string | null;
};

/**
 * Fetches active checkout states for tool management UI.
 */
export async function getActiveToolManagementStates(
  orgId: string,
  toolId?: string,
): Promise<Record<string, ToolManagementState>> {
  const supabase = await createClient();

  let query = supabase
    .from('tool_management')
    .select('id, tool_id, user_id, session_id, checked_out, notes')
    .eq('org_id', orgId)
    .is('checked_in', null);

  if (toolId) {
    query = query.eq('tool_id', toolId);
  }

  const { data, error } = await query;

  if (error) {
    return {};
  }

  const checkoutRows = (data ?? []) as ActiveToolCheckoutRow[];
  const userIds = Array.from(new Set(checkoutRows.map((row) => row.user_id)));
  const sessionIds = Array.from(
    new Set(checkoutRows.map((row) => row.session_id)),
  );
  const [accountNames, sessionNames] = await Promise.all([
    getAccountNames(userIds),
    getCheckoutSessionNames(sessionIds),
  ]);

  return Object.fromEntries(
    checkoutRows.map((checkout) => [
      checkout.tool_id,
      {
        activeCheckoutId: checkout.id,
        activeCheckoutUserName: accountNames.get(checkout.user_id) ?? null,
        activeCheckoutSessionName:
          sessionNames.get(checkout.session_id) ?? null,
        checkedOutAt: checkout.checked_out,
        checkoutNotes: checkout.notes,
      },
    ]),
  );
}

/**
 * Fetches account display names for active tool checkout metadata.
 */
async function getAccountNames(
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name')
    .in('id', userIds);

  if (error) {
    return new Map();
  }

  return new Map((data ?? []).map((account) => [account.id, account.name]));
}

/**
 * Fetches session names for active tool checkout metadata.
 */
async function getCheckoutSessionNames(
  sessionIds: string[],
): Promise<Map<string, string | null>> {
  if (sessionIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('id, session_name')
    .in('id', sessionIds);

  if (error) {
    return new Map();
  }

  return new Map(
    (data ?? []).map((session) => [session.id, session.session_name]),
  );
}

/**
 * Reads and trims an optional form string.
 */
function getOptionalFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Reads every submitted string value for a multi-value form key.
 */
function getFormStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Narrows submitted condition values to known tool conditions.
 */
function isToolCondition(value: string): value is ToolCondition {
  return TOOL_CONDITION_VALUES.includes(value as ToolCondition);
}

/**
 * Parses and validates checkout form values.
 */
function getCheckoutValues(formData: FormData) {
  const toolIds = getFormStringList(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolIds,
  );
  const singleToolId = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolId,
  );
  const condition = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition,
  );
  const requestedToolIds =
    toolIds.length > 0 ? toolIds : singleToolId ? [singleToolId] : [];

  if (
    requestedToolIds.length === 0 ||
    !condition ||
    !isToolCondition(condition) ||
    condition === 'OUT_OF_SERVICE'
  ) {
    return null;
  }

  return {
    toolIds: requestedToolIds,
    condition,
    notes: getOptionalFormString(
      formData,
      TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes,
    ),
    sessionName: getOptionalFormString(
      formData,
      TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.sessionName,
    ),
  };
}

/**
 * Parses and validates check-in form values.
 */
function getCheckinValues(formData: FormData) {
  const toolManagementId = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolManagementId,
  );
  const toolId = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolId,
  );
  const condition = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition,
  );

  if (
    (!toolManagementId && !toolId) ||
    !condition ||
    !isToolCondition(condition)
  ) {
    return null;
  }

  return {
    toolManagementId,
    toolId,
    condition,
    notes: getOptionalFormString(
      formData,
      TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes,
    ),
    returnImagePath: getOptionalFormString(
      formData,
      TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.returnImagePath,
    ),
  };
}

/**
 * Finds the active checkout row for a tool when the caller only has the tool id.
 */
async function getActiveToolManagementId(
  toolId: string,
  orgId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tool_management')
    .select('id')
    .eq('tool_id', toolId)
    .eq('org_id', orgId)
    .is('checked_in', null)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id ?? null;
}

/**
 * Checks one or more available tools out through the tool workflow RPC.
 */
export async function checkoutToolsAction(
  formData: FormData,
): Promise<ToolManagementActionState> {
  await requireOrgMember();
  const values = getCheckoutValues(formData);

  if (!values) {
    return { error: TOOLS_ACTION_TEXT.invalidCheckout };
  }

  const supabase = await createClient();
  const { data: sessionId, error } = await supabase.rpc('checkout_tools', {
    tool_ids: values.toolIds,
    condition: values.condition,
    notes: values.notes ?? '',
    session_name: values.sessionName ?? undefined,
  });

  if (error) {
    return { error: TOOLS_ACTION_TEXT.checkoutFailed };
  }

  const { data: activeCheckout } = await supabase
    .from('tool_management')
    .select('id')
    .eq('session_id', sessionId)
    .eq('tool_id', values.toolIds[0])
    .is('checked_in', null)
    .maybeSingle();

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  values.toolIds.forEach((toolId) => {
    revalidatePath(`${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${toolId}`);
  });

  return {
    success: true,
    sessionId,
    toolManagementId: activeCheckout?.id,
  };
}

/**
 * Checks a tool back in through the tool workflow RPC.
 */
export async function checkinToolAction(
  formData: FormData,
): Promise<ToolManagementActionState> {
  const { account } = await requireOrgMember();
  const values = getCheckinValues(formData);

  if (!values) {
    return { error: TOOLS_ACTION_TEXT.invalidCheckin };
  }

  const toolManagementId =
    values.toolManagementId ??
    (values.toolId
      ? await getActiveToolManagementId(values.toolId, account.org_id as string)
      : null);

  if (!toolManagementId) {
    return { error: TOOLS_ACTION_TEXT.invalidCheckin };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('return_tool', {
    tool_management_id: toolManagementId,
    condition_return: values.condition,
    notes: values.notes ?? undefined,
    return_image_path: values.returnImagePath ?? undefined,
  });

  if (error) {
    return { error: TOOLS_ACTION_TEXT.checkinFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);

  if (values.toolId) {
    revalidatePath(`${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${values.toolId}`);
  }

  return { success: true };
}
