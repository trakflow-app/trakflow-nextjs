import { TOOLS_MANAGEMENT } from '@/constants/components/tools/tools-constants';

/**
 * Compresses a browser image file to the tool catalog upload target.
 */
export async function compressToolCatalogImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: TOOLS_MANAGEMENT.FILES.CATALOG_IMAGE_MAX_WIDTH,
    quality: TOOLS_MANAGEMENT.FILES.CATALOG_IMAGE_QUALITY,
  });
}

/**
 * Compresses a browser image file to the tool evidence upload target.
 */
export async function compressToolEvidenceImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: TOOLS_MANAGEMENT.FILES.EVIDENCE_IMAGE_MAX_WIDTH,
    quality: TOOLS_MANAGEMENT.FILES.EVIDENCE_IMAGE_QUALITY,
  });
}

/**
 * Compresses a browser image file to a WebP image.
 */
async function compressImage(
  file: File,
  options: {
    maxWidth: number;
    quality: number;
  },
): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(1, options.maxWidth / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return file;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      resolve,
      TOOLS_MANAGEMENT.FILES.COMPRESSED_IMAGE_TYPE,
      options.quality,
    );
  });

  URL.revokeObjectURL(image.src);

  if (!blob) {
    return file;
  }

  return new File(
    [blob],
    file.name.replace(
      /\.[^.]+$/,
      `.${TOOLS_MANAGEMENT.FILES.COMPRESSED_IMAGE_EXTENSION}`,
    ),
    {
      type: TOOLS_MANAGEMENT.FILES.COMPRESSED_IMAGE_TYPE,
      lastModified: Date.now(),
    },
  );
}

/**
 * Loads a browser File into an HTML image for canvas compression.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image.'));
    };
    image.src = objectUrl;
  });
}
