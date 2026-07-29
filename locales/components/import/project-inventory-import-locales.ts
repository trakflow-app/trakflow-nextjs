export const projectInventoryImportText = {
  triggerButton: 'Import inventory',
  title: 'Import Project Inventory',
  description:
    'Add tools and materials from a spreadsheet, or from a PDF like an invoice or delivery ticket.',
  templateBadge: 'Shared review',
  csvMethodTitle: 'Upload a spreadsheet',
  csvMethodDescription:
    'Use this if your tools and materials are already listed in a spreadsheet.',
  ocrMethodTitle: 'Upload a PDF',
  ocrMethodDescription:
    'Use this for quotes, invoices, takeoffs, delivery tickets, receipts, and photos.',
  uploadLabel: 'Spreadsheet file',
  ocrUploadLabel: 'PDF or image',
  uploadButton: 'Choose spreadsheet',
  ocrUploadButton: 'Choose PDF or image',
  noFileSelected: 'No file selected',
  ocrExtracting: 'Reading your document…',
  ocrExtractSuccess: 'Done. Review the rows below before saving.',
  ocrIdleHint: 'Upload a PDF or image to fill in the rows below automatically.',
  templateTitle: 'Don’t have a spreadsheet yet?',
  templateDescription:
    'Download a blank template with the columns already set up, fill it in, and upload it above.',
  downloadTemplateButton: 'Download template',
  detectedProjectLabel: 'Detected project',
  matchedProjectLabel: 'Existing project match',
  noProjectDetected: 'No project detected',
  noProjectMatch: 'No existing project matched',
  multipleProjectsDetected: '{count} projects detected',
  unmatchedProjectsCount: '{count} rows need a project match',
  toolCountLabel: 'Tools',
  materialCountLabel: 'Materials',
  previewTitle: 'Review rows',
  previewSubtitle: 'Edit any row directly in the table to fix a problem.',
  emptyPreviewTitle: 'Upload a spreadsheet or PDF/image to preview rows',
  emptyPreviewDescription:
    'Rows with a problem are shown in red and can be edited right in the table.',
  rowsNeedFixNotice:
    '{count} of {total} rows need fixing before they can be imported. Edit the highlighted rows below.',
  readyBadge: 'Ready',
  needsFixBadge: 'Needs fix',
  tableColumns: {
    project: 'Project',
    name: 'Name',
    status: 'Status',
    condition: 'Condition',
    quantity: 'Quantity',
    unitCost: 'Unit cost',
    notes: 'Notes',
  },
  statusPlaceholder: 'Select status',
  conditionPlaceholder: 'Select condition',
  errors: {
    unsupportedFile: 'Upload a spreadsheet (CSV) file.',
    unsupportedOcrFile: 'Upload a PDF or image file.',
    readFailed: 'Failed to read the spreadsheet file.',
    missingHeaders: 'Missing required columns: {headers}.',
    emptyFile: 'The spreadsheet does not contain any rows.',
    invalidRows: '{count} rows could not be read and were left out.',
    unknownItemType: 'Use tool or material for item_type.',
    unmatchedProject:
      'This project name does not match an existing project. Fix the spelling or leave it blank for organization inventory.',
    missingName: 'Enter a name.',
    unknownToolStatus: 'Status must be Available, Out of Service, or Archived.',
    unknownToolCondition:
      'Condition must be Good, Fair, Damaged, or Out of Service.',
    missingMaterialQuantity: 'Enter a quantity of 0 or more.',
    missingMaterialUnitCost: 'Enter a cost greater than 0.',
    extractionFailed:
      'Could not read that file. Try a different file or use a spreadsheet instead.',
  },
  cancelButton: 'Cancel',
  saveButton: 'Import rows',
  savingButton: 'Importing…',
  saveDisabledMessage: 'Upload a spreadsheet or PDF/image to get started.',
  saveResults: {
    allSucceeded: '{count} items imported successfully.',
    partialSuccess:
      '{succeeded} items imported, {failed} rows failed. Fix and reimport the failed rows.',
    allFailed: 'No rows were imported. Fix the errors below and try again.',
  },
  skippedRowsNotice: {
    tool: '{count} material rows were skipped on this page. Import materials from the Materials page.',
    material:
      '{count} tool rows were skipped on this page. Import tools from the Tools page.',
  },
} as const;
