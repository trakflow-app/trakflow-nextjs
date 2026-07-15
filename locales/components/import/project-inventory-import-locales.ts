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
  ocrNotConnected:
    'Gemini extraction is planned for the next backend pass. CSV preview is available now.',
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
  emptyPreviewTitle: 'Upload a CSV to preview rows',
  emptyPreviewDescription:
    'The import will not create tools or materials until the backend workflow is added.',
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
  },
  cancelButton: 'Cancel',
  saveButton: 'Import drafts',
  saveDisabledMessage:
    'Import saving is not connected yet. This pass is preview UI only.',
} as const;
