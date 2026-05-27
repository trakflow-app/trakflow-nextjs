'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  TOOLS_MANAGEMENT,
  TOOL_CONDITION_VALUES,
  TOOL_STATUS_VALUES,
} from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';
import { TOOLS_ACTION_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];

/**
 * Result returned by tool mutation server actions.
 */
export type ToolActionState = {
  error?: string;
  success?: boolean;
} | null;

/**
 * Shared form values for create/edit tool actions, with parsing/validation logic
 */
type ToolFormValues = {
  name: string;
  tagNumber: number;
  status: ToolStatus;
  condition: ToolCondition;
  projectId: string | null;
  notes: string | null;
};

/**
 * Reads and trims a required string from form data.
 */
function getRequiredFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Narrows submitted status values to known tool statuses.
 */
function isToolStatus(value: string): value is ToolStatus {
  return TOOL_STATUS_VALUES.includes(value as ToolStatus);
}

/**
 * Narrows submitted condition values to known tool conditions.
 */
function isToolCondition(value: string): value is ToolCondition {
  return TOOL_CONDITION_VALUES.includes(value as ToolCondition);
}

/**
 * Parses and validates shared create/edit tool form values.
 */
function getToolFormValues(formData: FormData): ToolFormValues | null {
  const name = getRequiredFormString(formData, TOOLS_MANAGEMENT.FORM_KEYS.name);
  const tagNumberValue = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.tagNumber,
  );
  const status = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.status,
  );
  const condition = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.condition,
  );
  const projectIdValue = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.projectId,
  );
  const notesValue = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.notes);
  const tagNumber = tagNumberValue ? Number(tagNumberValue) : Number.NaN;

  if (
    !name ||
    !Number.isInteger(tagNumber) ||
    tagNumber < TOOLS_MANAGEMENT.LIMITS.MIN_TAG_NUMBER ||
    !status ||
    !isToolStatus(status) ||
    !condition ||
    !isToolCondition(condition)
  ) {
    return null;
  }

  return {
    name,
    tagNumber,
    status,
    condition,
    projectId:
      projectIdValue &&
      projectIdValue !== TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE
        ? projectIdValue
        : null,
    notes:
      typeof notesValue === 'string' && notesValue.trim().length > 0
        ? notesValue.trim()
        : null,
  };
}

/**
 * Creates a tool record scoped to the current user's organization.
 */
export async function createToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();
  const values = getToolFormValues(formData);

  if (!values) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('tools').insert({
    org_id: account.org_id as string,
    name: values.name,
    tag_number: values.tagNumber,
    status: values.status,
    condition: values.condition,
    project_id: values.projectId,
    notes: values.notes,
  });

  if (error) {
    return { error: TOOLS_ACTION_TEXT.createFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);

  return { success: true };
}

/**
 * Updates a tool record scoped to the current user's organization.
 */
export async function updateToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();
  const id = getRequiredFormString(formData, TOOLS_MANAGEMENT.FORM_KEYS.id);
  const values = getToolFormValues(formData);

  if (!id || !values) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tools')
    .update({
      name: values.name,
      tag_number: values.tagNumber,
      status: values.status,
      condition: values.condition,
      project_id: values.projectId,
      notes: values.notes,
    })
    .eq('id', id)
    .eq('org_id', account.org_id as string);

  if (error) {
    return { error: TOOLS_ACTION_TEXT.updateFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);

  return { success: true };
}

/**
 * Deletes a tool record scoped to the current user's organization.
 */
export async function deleteToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();
  const id = getRequiredFormString(formData, TOOLS_MANAGEMENT.FORM_KEYS.id);

  if (!id) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', id)
    .eq('org_id', account.org_id as string);

  if (error) {
    return { error: TOOLS_ACTION_TEXT.deleteFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);

  return { success: true };
}
