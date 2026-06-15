import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOOLS_MANAGEMENT } from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';

export type ToolEvidencePhotoType = 'checkout' | 'return';

/**
 * Builds a private storage path for activity evidence photos.
 */
export function getToolEvidencePath({
  toolId,
  transactionId,
  photoType,
}: {
  toolId: string;
  transactionId: string;
  photoType: ToolEvidencePhotoType;
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return `${TOOLS_MANAGEMENT.STORAGE.TOOL_IMAGES_PATH_PREFIX}/${toolId}/transactions/${transactionId}/${photoType}-${timestamp}.${TOOLS_MANAGEMENT.FILES.COMPRESSED_IMAGE_EXTENSION}`;
}

/**
 * Uploads an evidence photo to private tool evidence storage.
 */
export async function uploadToolEvidenceImage(
  supabase: SupabaseClient<Database>,
  imagePath: string,
  imageFile: File,
): Promise<string> {
  const imageBody = await imageFile.arrayBuffer();
  const { error } = await supabase.storage
    .from(TOOLS_MANAGEMENT.STORAGE.TOOL_EVIDENCE_BUCKET)
    .upload(imagePath, imageBody, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return imagePath;
}
