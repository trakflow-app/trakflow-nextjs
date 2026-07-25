'use server';

import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from '@google/generative-ai';
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
  quotaExceeded:
    'Gemini API quota exceeded for this key. Check billing/quota at https://ai.google.dev/gemini-api/docs/rate-limits, then try again.',
};

const EXTRACTION_PROMPT_BY_SCOPE: Record<'tool' | 'material', string> = {
  tool: `You are extracting a TOOL inventory from a construction document (quote, invoice,
receipt, delivery ticket, material takeoff, or project setup sheet). List only line items that
are tools or reusable equipment (e.g. drills, saws, ladders, hammers) — do not include materials,
supplies, or consumables even if they appear on the same document. Do not invent items that are
not present in the document.`,
  material: `You are extracting a MATERIAL inventory from a construction document (quote,
invoice, receipt, delivery ticket, material takeoff, or project setup sheet). List only line
items that are consumable materials or supplies (e.g. lumber, concrete, fasteners, safety
supplies) — do not include tools or reusable equipment even if they appear on the same document.
For quantity and unit cost, return null instead of guessing when the document does not clearly
state a value. Do not invent items that are not present in the document.`,
};

const toolItemSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    status: { type: SchemaType.STRING, nullable: true },
    condition: { type: SchemaType.STRING, nullable: true },
    notes: { type: SchemaType.STRING, nullable: true },
  },
  required: ['name'],
};

const materialItemSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    quantity: { type: SchemaType.NUMBER, nullable: true },
    unitCost: { type: SchemaType.NUMBER, nullable: true },
    notes: { type: SchemaType.STRING, nullable: true },
  },
  required: ['name'],
};

/**
 * Builds a response schema requesting only the item type matching the given scope,
 * so a single extraction call answers one yes/no classification question per item
 * instead of splitting items across two competing categories.
 */
function buildResponseSchema(scope: 'tool' | 'material'): Schema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      projectName: { type: SchemaType.STRING, nullable: true },
      items: {
        type: SchemaType.ARRAY,
        items: scope === 'tool' ? toolItemSchema : materialItemSchema,
      },
    },
    required: ['items'],
  };
}

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

/**
 * A single extraction call only ever asks Gemini for one item type, matching
 * the scope of the page the upload happened on — so the draft only ever
 * carries one populated list, never a "tools vs materials" split to resolve.
 */
export type ProjectInventoryExtractionDraft =
  | {
      itemType: 'tool';
      projectName: string | null;
      tools: ExtractedToolDraft[];
    }
  | {
      itemType: 'material';
      projectName: string | null;
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
 * `scope` restricts the request to a single item type, matching whichever page
 * (Tools or Materials) triggered the upload — Gemini is never asked to split
 * items across both categories in one call.
 * This never writes to the database — extraction only, review and save happen separately.
 */
export async function extractProjectInventoryFromDocument(
  formData: FormData,
  scope: 'tool' | 'material',
): Promise<ExtractProjectInventoryResult> {
  const { account } = await requireOrgMember();

  if (!INVENTORY_MANAGER_ROLES.includes(account.role as InventoryManagerRole)) {
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
      responseSchema: buildResponseSchema(scope),
    },
  });

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await model.generateContent([
      EXTRACTION_PROMPT_BY_SCOPE[scope],
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: file.type || 'application/pdf',
        },
      },
    ]);

    const parsed = JSON.parse(result.response.text()) as {
      projectName?: string | null;
      items?: ExtractedToolDraft[] | ExtractedMaterialDraft[];
    };
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const projectName = parsed.projectName ?? null;

    return {
      draft:
        scope === 'tool'
          ? {
              itemType: 'tool',
              projectName,
              tools: items as ExtractedToolDraft[],
            }
          : {
              itemType: 'material',
              projectName,
              materials: items as ExtractedMaterialDraft[],
            },
    };
  } catch (error) {
    console.error('Gemini inventory extraction failed:', error);

    if ((error as { status?: number } | null)?.status === 429) {
      return { error: EXTRACTION_ERRORS.quotaExceeded };
    }

    return { error: EXTRACTION_ERRORS.extractionFailed };
  }
}
