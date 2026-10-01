/**
 * Colors used exclusively by the generated project cost report PDF.
 * react-pdf renders to its own layout engine and cannot read the app's CSS
 * custom properties, so this report keeps a small self-contained palette
 * instead of trying to resolve the web theme at render time.
 */
export const PROJECT_COST_REPORT_PDF_COLORS = {
  text: '#111827',
  mutedText: '#6B7280',
  border: '#E5E7EB',
  accent: '#2563EB',
  tableHeaderBackground: '#F3F4F6',
} as const;

/**
 * Layout constants (sizes, spacing) for the generated project cost report PDF.
 */
export const PROJECT_COST_REPORT_PDF_LAYOUT = {
  PAGE_PADDING: 40,
  TITLE_FONT_SIZE: 20,
  SECTION_HEADING_FONT_SIZE: 12,
  BODY_FONT_SIZE: 10,
  SMALL_FONT_SIZE: 9,
  TOTAL_FONT_SIZE: 13,
  SECTION_GAP: 18,
  ROW_GAP: 6,
  TABLE_BORDER_WIDTH: 1,
  TABLE_CELL_PADDING: 6,
  MATERIAL_NAME_COLUMN_WIDTH: '40%',
  MATERIAL_QTY_COLUMN_WIDTH: '20%',
  MATERIAL_UNIT_COST_COLUMN_WIDTH: '20%',
  MATERIAL_TOTAL_COLUMN_WIDTH: '20%',
} as const;
