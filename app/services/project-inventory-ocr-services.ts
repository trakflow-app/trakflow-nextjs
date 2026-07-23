'use server';

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { requireOrgMember } from '@/lib/dal/auth';
import { PROJECT_INVENTORY_IMPORT } from '@/constants/components/import/project-inventory-import-constants';

type InventoryManagerRole = 'OWNER' | 'FOREMAN';

const INVENTORY_MANAGER_ROLES = [
  'OWNER',
  'FOREMAN',
] as const satisfies readonly InventoryManagerRole[];

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_OCR_FILE_BYTES = 15_000_000;

const EXTRACTION_ERRORS = {
  permissionDenied: 'You do not have permission to run document extraction.',
  missingFile: 'Upload a PDF or image file.',
  unsupportedFile: 'Upload a PDF or image file for Gemini extraction.',
  fileTooLarge: 'File is too large for extraction.',
  missingApiKey: 'Gemini extraction is not configured for this environment.',
  extractionFailed: 'Could not extract inventory data from this document.',
};

const EXTRACTION_PROMPT = `You are extracting a project tool and material inventory from a
construction document (quote, invoice, receipt, delivery ticket, material takeoff, or project
setup sheet). List every tool and material line item you can find. For quantity and unit cost,
return null instead of guessing when the document does not clearly state a value. Do not invent
items that are not present in the document.`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    projectName: { type: SchemaType.STRING, nullable: true },
    tools: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          status: { type: SchemaType.STRING, nullable: true },
          condition: { type: SchemaType.STRING, nullable: true },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name'],
      },
    },
    materials: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          quantity: { type: SchemaType.NUMBER, nullable: true },
          unitCost: { type: SchemaType.NUMBER, nullable: true },
          notes: { type: SchemaType.STRING, nullable: true },
        },
        required: ['name'],
      },
    },
  },
  required: ['tools', 'materials'],
};

export type ExtractedToolDraft = {
  name: string;
  status: string | null;
  condition: string | null;
  notes: string | null;
};

export type ExtractedMaterialDraft = {
  name: string;
  quantity: number | null;
  unitCost: number | null;
  notes: string | null;
};

export type ProjectInventoryExtractionDraft = {
  projectName: string | null;
  tools: ExtractedToolDraft[];
  materials: ExtractedMaterialDraft[];
};

export type ExtractProjectInventoryResult =
  | { draft: ProjectInventoryExtractionDraft; error?: undefined }
  | { draft?: undefined; error: string };

/**
 * Checks whether the uploaded file matches the accepted OCR file types.
 */
function isSupportedOcrFile(file: File): boolean {
  const normalizedFileName = file.name.toLowerCase();

  return (
    PROJECT_INVENTORY_IMPORT.FILES.OCR_EXTENSIONS.some((extension) =>
      normalizedFileName.endsWith(extension),
    ) ||
    PROJECT_INVENTORY_IMPORT.FILES.OCR_MIME_TYPES.includes(
      file.type as (typeof PROJECT_INVENTORY_IMPORT.FILES.OCR_MIME_TYPES)[number],
    ) ||
    PROJECT_INVENTORY_IMPORT.FILES.OCR_MIME_PREFIXES.some((prefix) =>
      file.type.startsWith(prefix),
    )
  );
}

/**
 * Extracts a project inventory draft from an uploaded PDF or image using Gemini.
 * This never writes to the database — extraction only, review and save happen separately.
 */
export async function extractProjectInventoryFromDocument(
  formData: FormData,
): Promise<ExtractProjectInventoryResult> {
  const { account } = await requireOrgMember();

  if (
    !INVENTORY_MANAGER_ROLES.includes(account.role as InventoryManagerRole)
  ) {
    return { error: EXTRACTION_ERRORS.permissionDenied };
  }

  const file = formData.get(PROJECT_INVENTORY_IMPORT.OCR.FILE_FIELD_NAME);

  if (!(file instanceof File) || file.size === 0) {
    return { error: EXTRACTION_ERRORS.missingFile };
  }

  if (!isSupportedOcrFile(file)) {
    return { error: EXTRACTION_ERRORS.unsupportedFile };
  }

  if (file.size > MAX_OCR_FILE_BYTES) {
    return { error: EXTRACTION_ERRORS.fileTooLarge };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { error: EXTRACTION_ERRORS.missingApiKey };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: file.type || 'application/pdf',
        },
      },
    ]);

    const parsed = JSON.parse(
      result.response.text(),
    ) as Partial<ProjectInventoryExtractionDraft>;

    return {
      draft: {
        projectName: parsed.projectName ?? null,
        tools: Array.isArray(parsed.tools) ? parsed.tools : [],
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      },
    };
  } catch {
    return { error: EXTRACTION_ERRORS.extractionFailed };
  }
}
