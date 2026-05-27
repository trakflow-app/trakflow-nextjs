'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
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

const TOOLS_PATH = '/tools';
const INVENTORY_PROJECT_VALUE = 'inventory';
const MIN_TAG_NUMBER = 1;
const FORM_KEYS = {
  id: 'id',
  name: 'name',
  tagNumber: 'tagNumber',
  status: 'status',
  condition: 'condition',
  projectId: 'projectId',
  notes: 'notes',
} as const;
const TOOL_STATUS_VALUES = [
  'AVAILABLE',
  'CHECKEDOUT',
  'OUT_OF_SERVICE',
  'ARCHIVED',
] as const satisfies readonly ToolStatus[];
const TOOL_CONDITION_VALUES = [
  'GOOD',
  'FAIR',
  'DAMAGED',
  'OUT_OF_SERVICE',
] as const satisfies readonly ToolCondition[];

type ToolFormValues = {
  name: string;
  tagNumber: number;
  status: ToolStatus;
  condition: ToolCondition;
  projectId: string | null;
  notes: string | null;
};

function getRequiredFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isToolStatus(value: string): value is ToolStatus {
  return TOOL_STATUS_VALUES.includes(value as ToolStatus);
}

function isToolCondition(value: string): value is ToolCondition {
  return TOOL_CONDITION_VALUES.includes(value as ToolCondition);
}

function getToolFormValues(formData: FormData): ToolFormValues | null {
  const name = getRequiredFormString(formData, FORM_KEYS.name);
  const tagNumberValue = getRequiredFormString(formData, FORM_KEYS.tagNumber);
  const status = getRequiredFormString(formData, FORM_KEYS.status);
  const condition = getRequiredFormString(formData, FORM_KEYS.condition);
  const projectIdValue = getRequiredFormString(formData, FORM_KEYS.projectId);
  const notesValue = formData.get(FORM_KEYS.notes);
  const tagNumber = tagNumberValue ? Number(tagNumberValue) : Number.NaN;

  if (
    !name ||
    !Number.isInteger(tagNumber) ||
    tagNumber < MIN_TAG_NUMBER ||
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
      projectIdValue && projectIdValue !== INVENTORY_PROJECT_VALUE
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

  revalidatePath(TOOLS_PATH);

  return { success: true };
}

/**
 * Updates a tool record scoped to the current user's organization.
 */
export async function updateToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();
  const id = getRequiredFormString(formData, FORM_KEYS.id);
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

  revalidatePath(TOOLS_PATH);

  return { success: true };
}

/**
 * Deletes a tool record scoped to the current user's organization.
 */
export async function deleteToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();
  const id = getRequiredFormString(formData, FORM_KEYS.id);

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

  revalidatePath(TOOLS_PATH);

  return { success: true };
}
