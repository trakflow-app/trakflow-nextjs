# Gemini Materials OCR Prefill Plan

## Summary

Add a simple OCR prefill flow to the Materials Add modal:

- User uploads one receipt or invoice image/PDF.
- Gemini extracts one likely material line item.
- The form is prefilled with `name`, `quantity`, and `unitCost`.
- The user reviews and edits the values before clicking the existing Add Material button.

OCR does not create materials directly, does not persist uploaded files, and does not add scan history in v1.

## Key Changes

- Add `GEMINI_API_KEY=` to `.env.example`.
- Add OCR constants for materials:
  - Accepted file types: `image/*` and `application/pdf`.
  - Conservative max upload size below Gemini inline request limits.
  - One OCR model constant, defaulting to the current free-tier Flash model available in AI Studio.
- Add localized Materials Add modal copy for:
  - Scan receipt/invoice button.
  - Selected filename.
  - Scanning state.
  - Successful prefill message.
  - Validation, rate-limit, and generic OCR errors.

## Implementation Changes

- Create `app/services/materials-ocr-services.ts` with a server action such as `extractMaterialFromReceiptAction(formData: FormData)`.
- In the OCR service:
  - Require authenticated org membership with `requireOrgMember()`.
  - Validate file presence, MIME type, and size.
  - Convert file bytes to base64 inline data.
  - Call Gemini with a structured JSON response schema.
  - Normalize Gemini output into:

```ts
type MaterialOcrResult = {
  name: string | null;
  quantity: number | null;
  unitCost: number | null;
  confidence: 'low' | 'medium' | 'high';
  error?: string;
};
```

- Use extraction rules that tell Gemini to:
  - Pick one clear construction/material line item.
  - Ignore vendor name, subtotal, tax, shipping, payment info, invoice metadata, and totals.
  - Return `null` for uncertain fields instead of guessing.
- Map Gemini 429/rate-limit failures to a friendly retryable error.
- Keep the provider call isolated in the OCR service so Gemini can later be swapped for OpenAI, Tesseract.js, Docling, or PaddleOCR.
- Update `MaterialsAddModal`:
  - Add a Scan receipt/invoice upload control near the top of the modal.
  - Show selected filename, loading state, success message, and error message.
  - On success, prefill only `name`, `quantity`, and `unitCost`.
  - Preserve `projectId` and `lowStockThreshold`.
  - Keep the existing Add Material submit as the only save action.

## Test Plan

- Validate file handling:
  - Missing file.
  - Unsupported type.
  - Image upload.
  - PDF upload.
  - Oversized file.
- Test OCR result normalization:
  - `null` values.
  - String numbers.
  - Invalid numbers.
  - Negative numbers.
  - Unsupported confidence values.
- Test provider error mapping:
  - Gemini 429/rate-limit response.
  - Missing API key.
  - Generic Gemini/API failure.
- Verify modal behavior:
  - OCR fills core fields.
  - User can edit prefilled values.
  - Project remains manual.
  - Low-stock threshold remains unchanged.
  - OCR failure does not clear existing form values.
  - Manual Add Material still works without OCR.
- Run `npm run type-check`.
- Run `npm run lint`.

## Assumptions

- V1 is simple prefill, not bulk import.
- No scan history, no persisted source files, and no Supabase migration.
- Gemini free-tier privacy and limits are acceptable for internal/prototype use.
- Free-tier model eligibility and limits should be rechecked in AI Studio before launch.
