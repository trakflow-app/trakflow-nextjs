export const projectInventoryImportText = {
  triggerButton: 'Import inventory',
  title: 'Import Project Inventory',
  description:
    'Import tools and materials from a CSV template now, or prepare a PDF/image for Gemini extraction next.',
  templateBadge: 'Shared review',
  csvMethodTitle: 'CSV template',
  csvMethodDescription:
    'Use a structured spreadsheet export when the project list is already organized.',
  ocrMethodTitle: 'Gemini OCR',
  ocrMethodDescription:
    'Use this for quotes, invoices, takeoffs, delivery tickets, receipts, and photos.',
  uploadLabel: 'CSV file',
  ocrUploadLabel: 'PDF or image',
  uploadButton: 'Choose CSV',
  ocrUploadButton: 'Choose PDF or image',
  noFileSelected: 'No file selected',
  ocrExtracting: 'Extracting tools and materials from your document…',
  ocrExtractSuccess: 'Extraction complete. Review the rows below before saving.',
  ocrIdleHint: 'Upload a PDF or image to extract tools and materials.',
  selectedFileLabel: 'Selected file',
  templateTitle: 'Expected columns',
  templateDescription:
    'Use project_name, item_type, name, quantity, unit_cost, condition, status, and notes.',
  templateExample:
    'Kitchen Remodel,tool,Cordless drill,,,Good,Available,Stored in trailer',
  detectedProjectLabel: 'Detected project',
  matchedProjectLabel: 'Existing project match',
  noProjectDetected: 'No project detected',
  noProjectMatch: 'No existing project matched',
  toolCountLabel: 'Tools',
  materialCountLabel: 'Materials',
  previewTitle: 'Review draft rows',
  emptyPreviewTitle: 'Upload a CSV or PDF/image to preview rows',
  emptyPreviewDescription:
    'Only rows that pass review are saved. Materials need a quantity and unit cost, and tool status/condition must match a known value.',
  tableColumns: {
    type: 'Type',
    project: 'Project',
    name: 'Name',
    details: 'Details',
    notes: 'Notes',
  },
  itemTypeLabels: {
    tool: 'Tool',
    material: 'Material',
  },
  rowDetails: {
    tool: '{status} / {condition}',
    material: 'Qty {quantity} / ${unitCost}',
    missingMaterialValues: 'Quantity or cost missing',
  },
  errors: {
    unsupportedFile: 'Upload a CSV file.',
    unsupportedOcrFile: 'Upload a PDF or image file for Gemini extraction.',
    readFailed: 'Failed to read the CSV file.',
    missingHeaders: 'Missing required columns: {headers}.',
    emptyFile: 'The CSV does not contain import rows.',
    invalidRows: '{count} rows could not be previewed.',
    unknownItemType: 'Use tool or material for item_type.',
    missingName: 'Each row needs a name.',
    unknownToolStatus:
      '{name}: status must be Available, Out of Service, or Archived.',
    unknownToolCondition:
      '{name}: condition must be Good, Fair, Damaged, or Out of Service.',
    missingMaterialQuantity: '{name}: quantity is required.',
    missingMaterialUnitCost: '{name}: unit cost is required and must be greater than 0.',
    extractionFailed: 'Extraction failed. Try a different file or enter rows via CSV.',
  },
  cancelButton: 'Cancel',
  saveButton: 'Import drafts',
  savingButton: 'Importing…',
  saveDisabledMessage: 'No rows are ready to import yet.',
  saveResults: {
    allSucceeded: '{count} items imported successfully.',
    partialSuccess:
      '{succeeded} items imported, {failed} rows failed. Fix and reimport the failed rows.',
    allFailed: 'No rows were imported. Fix the errors below and try again.',
  },
  materialNotesUnsupported:
    'Material notes are shown for review only and are not saved.',
  skippedRowsNotice: {
    tool: '{count} material rows were skipped on this page. Import materials from the Materials page.',
    material:
      '{count} tool rows were skipped on this page. Import tools from the Tools page.',
  },
} as const;
