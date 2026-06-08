import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOOLS_MANAGEMENT } from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';

/**
 * Builds the private storage path for the main catalog image of a tool.
 */
export function getToolImagePath(toolId: string) {
  return `${TOOLS_MANAGEMENT.STORAGE.TOOL_IMAGES_PATH_PREFIX}/${toolId}/${TOOLS_MANAGEMENT.STORAGE.TOOL_MAIN_IMAGE_FILE_NAME}`;
}

/**
 * Uploads a browser-compressed catalog image to private tool storage.
 */
export async function uploadToolCatalogImage(
  supabase: SupabaseClient<Database>,
  toolId: string,
  imageFile: File,
): Promise<string> {
  const imagePath = getToolImagePath(toolId);
  const { error } = await supabase.storage
    .from(TOOLS_MANAGEMENT.STORAGE.TOOL_IMAGES_BUCKET)
    .upload(imagePath, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return imagePath;
}

/**
 * Removes a tool catalog image from private storage.
 */
export async function removeToolCatalogImage(
  supabase: SupabaseClient<Database>,
  imagePath: string | null,
) {
  if (!imagePath) {
    return;
  }

  await supabase.storage
    .from(TOOLS_MANAGEMENT.STORAGE.TOOL_IMAGES_BUCKET)
    .remove([imagePath]);
}

/**
 * Resolves a private tool image path to a signed display URL.
 */
export async function createSignedToolImageUrl(
  supabase: SupabaseClient<Database>,
  imagePath: string | null,
): Promise<string | null> {
  if (!imagePath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(TOOLS_MANAGEMENT.STORAGE.TOOL_IMAGES_BUCKET)
    .createSignedUrl(
      imagePath,
      TOOLS_MANAGEMENT.STORAGE.SIGNED_URL_EXPIRES_IN_SECONDS,
    );

  if (error) {
    return null;
  }

  return data.signedUrl;
}
