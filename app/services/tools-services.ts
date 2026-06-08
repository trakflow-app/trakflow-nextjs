'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  TOOLS_MANAGEMENT,
  TOOL_CONDITION_VALUES,
  TOOL_MANUAL_STATUS_VALUES,
  TOOL_STATUS_VALUES,
} from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';
import {
  removeToolCatalogImage,
  uploadToolCatalogImage,
} from '@/lib/storage/tool-images';
import { TOOLS_ACTION_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];
type ToolManagerRole = 'OWNER' | 'FOREMAN';

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
  imageFile: File | null;
  notes: string | null;
};

const TOOL_MANAGER_ROLES = [
  'OWNER',
  'FOREMAN',
] as const satisfies readonly ToolManagerRole[];

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
 * Narrows submitted status values to statuses that can be changed manually.
 */
function isManualToolStatus(value: string): value is ToolStatus {
  return (TOOL_MANUAL_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Checks whether the current account can manage tool records.
 */
function canManageTools(role: Database['public']['Enums']['user_role'] | null) {
  return TOOL_MANAGER_ROLES.includes(role as ToolManagerRole);
}

/**
 * Reads an optional image file from form data.
 */
function getOptionalImageFile(formData: FormData): File | null {
  const value = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.imageFile);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

/**
 * Validates browser-compressed catalog image uploads.
 */
function getImageValidationError(file: File | null): string | null {
  if (!file) {
    return null;
  }

  if (!file.type.startsWith('image/')) {
    return TOOLS_ACTION_TEXT.imageInvalid;
  }

  if (file.size > TOOLS_MANAGEMENT.FILES.MAX_IMAGE_BYTES) {
    return TOOLS_ACTION_TEXT.imageTooLarge;
  }

  return null;
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
  const imageFile = getOptionalImageFile(formData);
  const tagNumber = tagNumberValue ? Number(tagNumberValue) : Number.NaN;

  if (
    !name ||
    !Number.isInteger(tagNumber) ||
    tagNumber < TOOLS_MANAGEMENT.LIMITS.MIN_TAG_NUMBER ||
    !status ||
    !isToolStatus(status) ||
    !isManualToolStatus(status) ||
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
    imageFile,
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

  if (!canManageTools(account.role)) {
    return { error: TOOLS_ACTION_TEXT.unauthorized };
  }

  const values = getToolFormValues(formData);

  if (!values) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const imageError = getImageValidationError(values.imageFile);

  if (imageError) {
    return { error: imageError };
  }

  const supabase = await createClient();
  const { data: tool, error } = await supabase
    .from('tools')
    .insert({
      org_id: account.org_id as string,
      name: values.name,
      tag_number: values.tagNumber,
      status: values.status,
      condition: values.condition,
      project_id: values.projectId,
      notes: values.notes,
    })
    .select('id')
    .single();

  if (error || !tool) {
    return { error: TOOLS_ACTION_TEXT.createFailed };
  }

  if (values.imageFile) {
    let imagePath: string;

    try {
      imagePath = await uploadToolCatalogImage(
        supabase,
        tool.id,
        values.imageFile,
      );
    } catch {
      await supabase
        .from('tools')
        .delete()
        .eq('id', tool.id)
        .eq('org_id', account.org_id as string);

      return { error: TOOLS_ACTION_TEXT.imageUploadFailed };
    }

    const { error: imagePathError } = await supabase
      .from('tools')
      .update({ image_path: imagePath })
      .eq('id', tool.id)
      .eq('org_id', account.org_id as string);

    if (imagePathError) {
      await removeToolCatalogImage(supabase, imagePath);
      await supabase
        .from('tools')
        .delete()
        .eq('id', tool.id)
        .eq('org_id', account.org_id as string);

      return { error: TOOLS_ACTION_TEXT.imageUploadFailed };
    }
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

  if (!canManageTools(account.role)) {
    return { error: TOOLS_ACTION_TEXT.unauthorized };
  }

  const id = getRequiredFormString(formData, TOOLS_MANAGEMENT.FORM_KEYS.id);
  const values = getToolFormValues(formData);

  if (!id || !values) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const imageError = getImageValidationError(values.imageFile);

  if (imageError) {
    return { error: imageError };
  }

  const supabase = await createClient();
  let imagePath: string | null | undefined;

  if (values.imageFile) {
    try {
      imagePath = await uploadToolCatalogImage(supabase, id, values.imageFile);
    } catch {
      return { error: TOOLS_ACTION_TEXT.imageUploadFailed };
    }
  }

  const { error } = await supabase
    .from('tools')
    .update({
      name: values.name,
      tag_number: values.tagNumber,
      status: values.status,
      condition: values.condition,
      project_id: values.projectId,
      ...(imagePath ? { image_path: imagePath } : {}),
      notes: values.notes,
    })
    .eq('id', id)
    .eq('org_id', account.org_id as string);

  if (error) {
    return { error: TOOLS_ACTION_TEXT.updateFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  revalidatePath(`${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${id}`);

  return { success: true };
}

/**
 * Deletes a tool record scoped to the current user's organization.
 */
export async function deleteToolAction(
  formData: FormData,
): Promise<ToolActionState> {
  const { account } = await requireOrgMember();

  if (!canManageTools(account.role)) {
    return { error: TOOLS_ACTION_TEXT.unauthorized };
  }

  const id = getRequiredFormString(formData, TOOLS_MANAGEMENT.FORM_KEYS.id);

  if (!id) {
    return { error: TOOLS_ACTION_TEXT.invalidTool };
  }

  const supabase = await createClient();
  const { data: existingTool } = await supabase
    .from('tools')
    .select('image_path')
    .eq('id', id)
    .eq('org_id', account.org_id as string)
    .single();

  await removeToolCatalogImage(supabase, existingTool?.image_path ?? null);

  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', id)
    .eq('org_id', account.org_id as string);

  if (error) {
    return { error: TOOLS_ACTION_TEXT.deleteFailed };
  }

  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  revalidatePath(`${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${id}`);

  return { success: true };
}
