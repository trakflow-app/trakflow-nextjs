/**
 * Shared constants for project inventory import UI.
 */
export const PROJECT_INVENTORY_IMPORT = {
  FILES: {
    CSV_ACCEPT: '.csv,text/csv,application/csv',
    CSV_EXTENSION: '.csv',
    CSV_MIME_TYPES: ['text/csv', 'application/csv'] as const,
    OCR_ACCEPT: 'image/*,application/pdf',
    OCR_EXTENSIONS: ['.pdf'] as const,
    OCR_MIME_PREFIXES: ['image/'] as const,
    OCR_MIME_TYPES: ['application/pdf'] as const,
  },
  CSV_HEADERS: {
    projectName: 'project_name',
    itemType: 'item_type',
    name: 'name',
    quantity: 'quantity',
    unitCost: 'unit_cost',
    condition: 'condition',
    status: 'status',
    notes: 'notes',
  },
  ITEM_TYPES: {
    TOOL: 'tool',
    MATERIAL: 'material',
  },
  DEFAULTS: {
    TOOL_STATUS: 'Available',
    TOOL_CONDITION: 'Good',
  },
  PREVIEW: {
    MAX_ERROR_COUNT: 3,
  },
} as const;

export const PROJECT_INVENTORY_IMPORT_REQUIRED_HEADERS = [
  PROJECT_INVENTORY_IMPORT.CSV_HEADERS.projectName,
  PROJECT_INVENTORY_IMPORT.CSV_HEADERS.itemType,
  PROJECT_INVENTORY_IMPORT.CSV_HEADERS.name,
] as const;
