import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import {
  PROJECT_COST_REPORT_PDF_COLORS,
  PROJECT_COST_REPORT_PDF_LAYOUT,
} from '@/constants/lib/pdf/project-cost-report-constants';
import formatCurrency from '@/lib/numeric-formatting';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';

const { report } = PROJECT_DETAIL_MESSAGES.costExport;

/**
 * Material line item rendered in the project cost report's materials table.
 */
export type ProjectCostReportMaterial = {
  id: string;
  name: string;
  unitCost: number;
  unitQty: number;
};

/**
 * Data needed to render a project's cost report PDF.
 */
export type ProjectCostReportData = {
  projectName: string;
  status: 'ACTIVE' | 'COMPLETED';
  startDate: string;
  endDate: string | null;
  budgetAmount: number | null;
  materials: ProjectCostReportMaterial[];
  totalMaterialsCost: number;
  generatedAt: Date;
};

const styles = StyleSheet.create({
  page: {
    padding: PROJECT_COST_REPORT_PDF_LAYOUT.PAGE_PADDING,
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.BODY_FONT_SIZE,
    color: PROJECT_COST_REPORT_PDF_COLORS.text,
  },
  reportLabel: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.SMALL_FONT_SIZE,
    fontWeight: 700,
    color: PROJECT_COST_REPORT_PDF_COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: PROJECT_COST_REPORT_PDF_LAYOUT.ROW_GAP / 2,
  },
  title: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.TITLE_FONT_SIZE,
    fontWeight: 700,
    marginBottom: PROJECT_COST_REPORT_PDF_LAYOUT.ROW_GAP,
  },
  generatedAt: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.SMALL_FONT_SIZE,
    color: PROJECT_COST_REPORT_PDF_COLORS.mutedText,
    marginBottom: PROJECT_COST_REPORT_PDF_LAYOUT.SECTION_GAP,
  },
  section: {
    marginBottom: PROJECT_COST_REPORT_PDF_LAYOUT.SECTION_GAP,
  },
  sectionHeading: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.SECTION_HEADING_FONT_SIZE,
    fontWeight: 700,
    marginBottom: PROJECT_COST_REPORT_PDF_LAYOUT.ROW_GAP,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: PROJECT_COST_REPORT_PDF_LAYOUT.ROW_GAP / 2,
    borderBottomWidth: PROJECT_COST_REPORT_PDF_LAYOUT.TABLE_BORDER_WIDTH,
    borderBottomColor: PROJECT_COST_REPORT_PDF_COLORS.border,
  },
  detailLabel: {
    color: PROJECT_COST_REPORT_PDF_COLORS.mutedText,
  },
  detailValue: {
    fontWeight: 700,
  },
  table: {
    borderWidth: PROJECT_COST_REPORT_PDF_LAYOUT.TABLE_BORDER_WIDTH,
    borderColor: PROJECT_COST_REPORT_PDF_COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    backgroundColor: PROJECT_COST_REPORT_PDF_COLORS.tableHeaderBackground,
  },
  tableCell: {
    padding: PROJECT_COST_REPORT_PDF_LAYOUT.TABLE_CELL_PADDING,
    borderBottomWidth: PROJECT_COST_REPORT_PDF_LAYOUT.TABLE_BORDER_WIDTH,
    borderBottomColor: PROJECT_COST_REPORT_PDF_COLORS.border,
  },
  tableHeaderCell: {
    fontWeight: 700,
  },
  nameColumn: {
    width: PROJECT_COST_REPORT_PDF_LAYOUT.MATERIAL_NAME_COLUMN_WIDTH,
  },
  qtyColumn: {
    width: PROJECT_COST_REPORT_PDF_LAYOUT.MATERIAL_QTY_COLUMN_WIDTH,
  },
  unitCostColumn: {
    width: PROJECT_COST_REPORT_PDF_LAYOUT.MATERIAL_UNIT_COST_COLUMN_WIDTH,
  },
  totalColumn: {
    width: PROJECT_COST_REPORT_PDF_LAYOUT.MATERIAL_TOTAL_COLUMN_WIDTH,
  },
  emptyMaterials: {
    color: PROJECT_COST_REPORT_PDF_COLORS.mutedText,
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: PROJECT_COST_REPORT_PDF_LAYOUT.SECTION_GAP,
    paddingTop: PROJECT_COST_REPORT_PDF_LAYOUT.ROW_GAP,
    borderTopWidth: PROJECT_COST_REPORT_PDF_LAYOUT.TABLE_BORDER_WIDTH,
    borderTopColor: PROJECT_COST_REPORT_PDF_COLORS.text,
  },
  totalCostLabel: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.TOTAL_FONT_SIZE,
    fontWeight: 700,
  },
  totalCostValue: {
    fontSize: PROJECT_COST_REPORT_PDF_LAYOUT.TOTAL_FONT_SIZE,
    fontWeight: 700,
    color: PROJECT_COST_REPORT_PDF_COLORS.accent,
  },
});

/**
 * Formats an ISO date string (YYYY-MM-DD) as a human-readable date.
 */
function formatReportDate(dateStr: string): string {
  // Date-only strings parse as UTC midnight; formatting in UTC keeps the calendar day intact.
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Formats a timestamp as a human-readable date and time for the report header.
 */
function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Printable PDF document showing a project's cost breakdown: core project
 * details, budget (when available), an assigned-materials cost table, and
 * the total project cost.
 */
export function ProjectCostReportDocument({
  data,
}: {
  data: ProjectCostReportData;
}) {
  const hasMaterials = data.materials.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.reportLabel}>{report.title}</Text>
        <Text style={styles.title}>{data.projectName}</Text>
        <Text style={styles.generatedAt}>
          {report.generatedAtLabel}: {formatGeneratedAt(data.generatedAt)}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{report.detailsHeading}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{report.statusLabel}</Text>
            <Text style={styles.detailValue}>
              {report.statusLabels[data.status]}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{report.startDateLabel}</Text>
            <Text style={styles.detailValue}>
              {formatReportDate(data.startDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{report.endDateLabel}</Text>
            <Text style={styles.detailValue}>
              {data.endDate ? formatReportDate(data.endDate) : report.noEndDate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{report.budgetLabel}</Text>
            <Text style={styles.detailValue}>
              {data.budgetAmount
                ? formatCurrency(data.budgetAmount)
                : report.noBudget}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{report.materialsHeading}</Text>
          {hasMaterials ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableHeaderCell,
                    styles.nameColumn,
                  ]}
                >
                  {report.columns.name}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableHeaderCell,
                    styles.qtyColumn,
                  ]}
                >
                  {report.columns.quantity}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableHeaderCell,
                    styles.unitCostColumn,
                  ]}
                >
                  {report.columns.unitCost}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableHeaderCell,
                    styles.totalColumn,
                  ]}
                >
                  {report.columns.total}
                </Text>
              </View>
              {data.materials.map((material) => (
                <View style={styles.tableRow} key={material.id}>
                  <Text style={[styles.tableCell, styles.nameColumn]}>
                    {material.name}
                  </Text>
                  <Text style={[styles.tableCell, styles.qtyColumn]}>
                    {material.unitQty}
                  </Text>
                  <Text style={[styles.tableCell, styles.unitCostColumn]}>
                    {formatCurrency(material.unitCost)}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalColumn]}>
                    {formatCurrency(material.unitQty * material.unitCost)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyMaterials}>{report.materialsEmpty}</Text>
          )}
        </View>

        <View style={styles.totalCostRow}>
          <Text style={styles.totalCostLabel}>{report.totalCostLabel}</Text>
          <Text style={styles.totalCostValue}>
            {formatCurrency(data.totalMaterialsCost)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Renders the project cost report to a PDF byte buffer for download.
 */
export async function renderProjectCostReportPdf(
  data: ProjectCostReportData,
): Promise<Buffer> {
  return renderToBuffer(<ProjectCostReportDocument data={data} />);
}
