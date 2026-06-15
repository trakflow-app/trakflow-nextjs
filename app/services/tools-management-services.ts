'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  TOOLS_MANAGEMENT,
  TOOL_CHECKOUT_CONDITION_OPTIONS,
  TOOL_CONDITION_VALUES,
} from '@/constants/components/tools/tools-constants';
import {
  getToolEvidencePath,
  uploadToolEvidenceImage,
} from '@/lib/storage/tool-evidence';
import type { Database } from '@/lib/types/database.types';
import { TOOLS_ACTION_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolCondition = Database['public']['Enums']['tool_condition'];

/**
 * Result returned by tool checkout and return server actions.
 */
export type ToolManagementActionState = {
  error?: string;
  success?: boolean;
} | null;

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
 * Reads and trims an optional string from form data.
 */
function getOptionalFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Reads an optional image file from form data.
 */
function getOptionalImageFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

/**
 * Narrows submitted condition values to known tool conditions.
 */
function isToolCondition(value: string): value is ToolCondition {
  return TOOL_CONDITION_VALUES.includes(value as ToolCondition);
}

/**
 * Checks whether a condition can be used for checkout.
 */
function isCheckoutCondition(value: string): value is ToolCondition {
  return TOOL_CHECKOUT_CONDITION_OPTIONS.some(
    (option) => option.value === value,
  );
}

/**
 * Validates an optional evidence image upload.
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
 * Revalidates list and detail routes affected by a tool workflow action.
 */
function revalidateToolRoutes(toolId: string) {
  revalidatePath(TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH);
  revalidatePath(`${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${toolId}`);
}

/**
 * Checks out a tool through the atomic checkout RPC.
 */
export async function checkoutToolAction(
  formData: FormData,
): Promise<ToolManagementActionState> {
  await requireOrgMember();
  const toolId = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.toolId,
  );
  const condition = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.checkoutCondition,
  );
  const notes = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.checkoutNotes,
  );
  const sessionName = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.checkoutSessionName,
  );

  if (!toolId || !condition || !isCheckoutCondition(condition)) {
    return { error: TOOLS_ACTION_TEXT.invalidCheckout };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('checkout_tools', {
    tool_ids: [toolId],
    condition,
    notes,
    session_name: sessionName || undefined,
  });

  if (error) {
    return { error: TOOLS_ACTION_TEXT.checkoutFailed };
  }

  revalidateToolRoutes(toolId);

  return { success: true };
}

/**
 * Returns a checked-out tool through the return RPC.
 */
export async function returnToolAction(
  formData: FormData,
): Promise<ToolManagementActionState> {
  const { account } = await requireOrgMember();
  const toolId = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.toolId,
  );
  const condition = getRequiredFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.returnCondition,
  );
  const notes = getOptionalFormString(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.returnNotes,
  );
  const imageFile = getOptionalImageFile(
    formData,
    TOOLS_MANAGEMENT.FORM_KEYS.returnImageFile,
  );

  if (!toolId || !condition || !isToolCondition(condition)) {
    return { error: TOOLS_ACTION_TEXT.invalidReturn };
  }

  const imageError = getImageValidationError(imageFile);

  if (imageError) {
    return { error: imageError };
  }

  const supabase = await createClient();
  const { data: checkoutRecord, error: checkoutError } = await supabase
    .from('tool_management')
    .select('id')
    .eq('tool_id', toolId)
    .eq('org_id', account.org_id as string)
    .is('checked_in', null)
    .order('checked_out', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkoutError || !checkoutRecord) {
    return { error: TOOLS_ACTION_TEXT.returnFailed };
  }

  let returnImagePath: string | undefined;

  if (imageFile) {
    returnImagePath = getToolEvidencePath({
      toolId,
      transactionId: checkoutRecord.id,
      photoType: 'return',
    });

    try {
      await uploadToolEvidenceImage(supabase, returnImagePath, imageFile);
    } catch {
      return { error: TOOLS_ACTION_TEXT.evidenceUploadFailed };
    }
  }

  const { error } = await supabase.rpc('return_tool', {
    tool_management_id: checkoutRecord.id,
    condition_return: condition,
    notes,
    return_image_path: returnImagePath,
  });

  if (error) {
    return { error: TOOLS_ACTION_TEXT.returnFailed };
  }

  revalidateToolRoutes(toolId);

  return { success: true };
}
