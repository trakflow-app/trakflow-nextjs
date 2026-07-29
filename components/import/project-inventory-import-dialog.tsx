'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PROJECT_INVENTORY_IMPORT,
  PROJECT_INVENTORY_IMPORT_REQUIRED_HEADERS,
  PROJECT_INVENTORY_IMPORT_TEMPLATE_CSV,
} from '@/constants/components/import/project-inventory-import-constants';
import {
  TOOL_CONDITION_OPTIONS,
  TOOL_STATUS_OPTIONS,
} from '@/constants/components/tools/tools-constants';
import { projectInventoryImportText } from '@/locales/components/import/project-inventory-import-locales';
import {
  normalizeToolCondition,
  normalizeToolStatus,
} from '@/lib/validations/project-inventory-import-validations';
import { importProjectInventoryAction } from '@/app/services/project-inventory-import-services';
import {
  extractProjectInventoryFromDocument,
  type ProjectInventoryExtractionDraft,
} from '@/app/services/project-inventory-ocr-services';
import { showToast } from '@/lib/toast';

type ImportItemType =
  (typeof PROJECT_INVENTORY_IMPORT.ITEM_TYPES)[keyof typeof PROJECT_INVENTORY_IMPORT.ITEM_TYPES];

type ImportProjectOption = {
  id: string;
  name: string;
};

type ImportPreviewRow = {
  id: string;
  itemType: ImportItemType;
  projectName: string;
  /** Resolved from projectName against the caller's project list; null means org inventory or unmatched. */
  projectId: string | null;
  /** False when projectName is non-empty but did not match a known project. */
  projectMatched: boolean;
  name: string;
  quantity: string;
  unitCost: string;
  condition: string;
  status: string;
  notes: string;
  /** Null when the row is ready to import; otherwise the problem to fix, shown inline. */
  rowError: string | null;
};

type CsvParseResult = {
  errors: string[];
  rows: ImportPreviewRow[];
  skippedCount: number;
};

type ProjectInventoryImportDialogProps = {
  projects: ImportProjectOption[];
  /** Restricts saved rows to this item type, matching which page (Tools or Materials) rendered the dialog. */
  scope: ImportItemType;
};

const CSV_FILE_INPUT_ID = 'project-inventory-import-csv-file';
const OCR_FILE_INPUT_ID = 'project-inventory-import-ocr-file';
const CSV_SPLIT_PATTERN = /\r?\n/;
const CSV_QUOTE = '"';
const CSV_CELL_SEPARATOR = ',';
const EMPTY_CELL = '';
const ROW_ID_SEPARATOR = '-';

/**
 * Dialog for previewing and saving project tools and materials from import extractors.
 */
export function ProjectInventoryImportDialog({
  projects,
  scope,
}: ProjectInventoryImportDialogProps) {
  const router = useRouter();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const ocrInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [ocrFileName, setOcrFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isExtracting, startExtractTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const isBusy = isExtracting || isSaving;
  const hasUpload = Boolean(csvFileName || ocrFileName);
  const readyRows = useMemo(
    () => previewRows.filter((row) => !row.rowError),
    [previewRows],
  );
  const needsFixCount = previewRows.length - readyRows.length;

  const detectedProjectNames = useMemo(
    () =>
      Array.from(
        new Set(
          previewRows.map((row) => row.projectName.trim()).filter(Boolean),
        ),
      ),
    [previewRows],
  );
  const unmatchedProjectCount = useMemo(
    () =>
      previewRows.filter((row) => row.projectName.trim() && !row.projectMatched)
        .length,
    [previewRows],
  );

  /**
   * Resets the local preview when the dialog closes.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isBusy) {
      return;
    }

    if (!nextOpen) {
      resetPreview();
    }

    setOpen(nextOpen);
  }

  /**
   * Reads and parses the selected CSV for preview.
   */
  async function handleCsvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      resetPreview();
      return;
    }

    setCsvFileName(file.name);
    setOcrFileName('');
    setSkippedCount(0);

    if (!isCsvFile(file)) {
      setPreviewRows([]);
      setErrors([projectInventoryImportText.errors.unsupportedFile]);
      return;
    }

    try {
      const csvText = await file.text();
      const result = parseInventoryCsv(csvText, scope, projects);
      setPreviewRows(result.rows);
      setErrors(result.errors);
      setSkippedCount(result.skippedCount);
    } catch {
      setPreviewRows([]);
      setErrors([projectInventoryImportText.errors.readFailed]);
    }
  }

  /**
   * Sends the selected document to the extraction service and populates the preview from the draft it returns.
   */
  function handleOcrFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setOcrFileName('');
      return;
    }

    setOcrFileName(file.name);
    setCsvFileName('');
    setSkippedCount(0);

    if (!isOcrFile(file)) {
      setPreviewRows([]);
      setErrors([projectInventoryImportText.errors.unsupportedOcrFile]);
      return;
    }

    setErrors([]);
    setPreviewRows([]);

    const formData = new FormData();
    formData.set(PROJECT_INVENTORY_IMPORT.OCR.FILE_FIELD_NAME, file);

    startExtractTransition(() => {
      void (async () => {
        const result = await extractProjectInventoryFromDocument(
          formData,
          scope,
        );

        if (!result.draft) {
          setErrors([result.error]);
          return;
        }

        setPreviewRows(
          buildPreviewRowsFromExtractionDraft(result.draft, projects),
        );
        setErrors([]);
        setSkippedCount(0);
      })();
    });
  }

  /**
   * Downloads a blank spreadsheet template with the expected columns filled in as an example.
   */
  function handleDownloadTemplate() {
    const blob = new Blob([PROJECT_INVENTORY_IMPORT_TEMPLATE_CSV], {
      type: PROJECT_INVENTORY_IMPORT.TEMPLATE.MIME_TYPE,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = PROJECT_INVENTORY_IMPORT.TEMPLATE.FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Applies an inline edit to one preview row and re-validates it so the
   * ready/needs-fix state updates as the user types, without a re-upload.
   */
  function handleRowFieldChange(
    rowId: string,
    patch: Partial<
      Pick<
        ImportPreviewRow,
        'name' | 'status' | 'condition' | 'quantity' | 'unitCost'
      >
    >,
  ) {
    setPreviewRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextRow = { ...row, ...patch };
        return { ...nextRow, rowError: validateRow(nextRow) };
      }),
    );
  }

  /**
   * Saves the reviewed draft rows as tools and materials. Only rows without a
   * validation problem are sent; rows still needing a fix stay in the preview.
   */
  function handleSave() {
    const nameById = new Map(previewRows.map((row) => [row.id, row.name]));
    const toolsPayload = readyRows
      .filter(
        (row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL,
      )
      .map((row) => ({
        id: row.id,
        projectId: row.projectId,
        name: row.name,
        status: row.status,
        condition: row.condition,
        notes: row.notes || null,
      }));
    const materialsPayload = readyRows
      .filter(
        (row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL,
      )
      .map((row) => ({
        id: row.id,
        projectId: row.projectId,
        name: row.name,
        quantity: Number(row.quantity),
        unitCost: Number(row.unitCost),
      }));

    startSaveTransition(() => {
      void (async () => {
        const result = await importProjectInventoryAction({
          tools: toolsPayload,
          materials: materialsPayload,
        });

        if (result.error) {
          showToast(result.error, 'error');
          return;
        }

        const rowResults = result.results ?? [];
        const failedResults = rowResults.filter((row) => !row.success);
        const succeededCount = rowResults.length - failedResults.length;

        if (failedResults.length === 0) {
          showToast(
            projectInventoryImportText.saveResults.allSucceeded.replace(
              '{count}',
              String(succeededCount),
            ),
            'success',
          );
          resetPreview();
          setOpen(false);
          router.refresh();
          return;
        }

        const failedIds = new Set(failedResults.map((row) => row.id));
        setPreviewRows((rows) => rows.filter((row) => failedIds.has(row.id)));
        setErrors(
          failedResults.map(
            (row) =>
              `${nameById.get(row.id) ?? row.id}: ${row.error ?? 'Could not be saved.'}`,
          ),
        );

        if (succeededCount > 0) {
          showToast(
            projectInventoryImportText.saveResults.partialSuccess
              .replace('{succeeded}', String(succeededCount))
              .replace('{failed}', String(failedResults.length)),
            'error',
          );
          router.refresh();
        } else {
          showToast(projectInventoryImportText.saveResults.allFailed, 'error');
        }
      })();
    });
  }

  /**
   * Clears the selected file and parsed preview rows.
   */
  function resetPreview() {
    setCsvFileName('');
    setOcrFileName('');
    setPreviewRows([]);
    setErrors([]);
    setSkippedCount(0);

    if (csvInputRef.current) {
      csvInputRef.current.value = EMPTY_CELL;
    }

    if (ocrInputRef.current) {
      ocrInputRef.current.value = EMPTY_CELL;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp data-icon="inline-start" />
          {projectInventoryImportText.triggerButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{projectInventoryImportText.title}</DialogTitle>
            <Badge variant="secondary">
              {projectInventoryImportText.templateBadge}
            </Badge>
          </div>
          <DialogDescription>
            {projectInventoryImportText.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileUp data-icon="inline-start" />
                  <h3 className="text-sm font-medium">
                    {projectInventoryImportText.csvMethodTitle}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectInventoryImportText.csvMethodDescription}
                </p>
              </div>
              <ImportField
                label={projectInventoryImportText.uploadLabel}
                htmlFor={CSV_FILE_INPUT_ID}
              >
                <Input
                  ref={csvInputRef}
                  id={CSV_FILE_INPUT_ID}
                  type="file"
                  accept={PROJECT_INVENTORY_IMPORT.FILES.CSV_ACCEPT}
                  className="sr-only"
                  disabled={isBusy}
                  onChange={handleCsvFileChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label
                      htmlFor={CSV_FILE_INPUT_ID}
                      className="cursor-pointer"
                    >
                      <Upload data-icon="inline-start" />
                      {projectInventoryImportText.uploadButton}
                    </label>
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {csvFileName || projectInventoryImportText.noFileSelected}
                  </span>
                </div>
              </ImportField>
              <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
                <div className="text-sm font-medium">
                  {projectInventoryImportText.templateTitle}
                </div>
                <p className="text-sm text-muted-foreground">
                  {projectInventoryImportText.templateDescription}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={handleDownloadTemplate}
                >
                  <Download data-icon="inline-start" />
                  {projectInventoryImportText.downloadTemplateButton}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles data-icon="inline-start" />
                  <h3 className="text-sm font-medium">
                    {projectInventoryImportText.ocrMethodTitle}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectInventoryImportText.ocrMethodDescription}
                </p>
              </div>
              <ImportField
                label={projectInventoryImportText.ocrUploadLabel}
                htmlFor={OCR_FILE_INPUT_ID}
              >
                <Input
                  ref={ocrInputRef}
                  id={OCR_FILE_INPUT_ID}
                  type="file"
                  accept={PROJECT_INVENTORY_IMPORT.FILES.OCR_ACCEPT}
                  className="sr-only"
                  disabled={isBusy}
                  onChange={handleOcrFileChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label
                      htmlFor={OCR_FILE_INPUT_ID}
                      className="cursor-pointer"
                    >
                      <Upload data-icon="inline-start" />
                      {projectInventoryImportText.ocrUploadButton}
                    </label>
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {ocrFileName || projectInventoryImportText.noFileSelected}
                  </span>
                </div>
              </ImportField>
              <OcrStatus
                isExtracting={isExtracting}
                hasSucceeded={Boolean(ocrFileName) && errors.length === 0}
              />
            </div>
          </div>

          {skippedCount > 0 ? (
            <div className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
              {projectInventoryImportText.skippedRowsNotice[scope].replace(
                '{count}',
                String(skippedCount),
              )}
            </div>
          ) : null}

          {errors.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {errors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          ) : null}

          {needsFixCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                {projectInventoryImportText.rowsNeedFixNotice
                  .replace('{count}', String(needsFixCount))
                  .replace('{total}', String(previewRows.length))}
              </span>
            </div>
          ) : null}

          {hasUpload ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ImportSummaryTile
                label={projectInventoryImportText.detectedProjectLabel}
                value={
                  detectedProjectNames.length === 0
                    ? projectInventoryImportText.noProjectDetected
                    : detectedProjectNames.length === 1
                      ? detectedProjectNames[0]
                      : projectInventoryImportText.multipleProjectsDetected.replace(
                          '{count}',
                          String(detectedProjectNames.length),
                        )
                }
              />
              <ImportSummaryTile
                label={projectInventoryImportText.matchedProjectLabel}
                value={
                  unmatchedProjectCount > 0
                    ? projectInventoryImportText.unmatchedProjectsCount.replace(
                        '{count}',
                        String(unmatchedProjectCount),
                      )
                    : (detectedProjectNames[0] ??
                      projectInventoryImportText.noProjectMatch)
                }
              />
              <ImportSummaryTile
                label={
                  scope === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL
                    ? projectInventoryImportText.toolCountLabel
                    : projectInventoryImportText.materialCountLabel
                }
                value={String(previewRows.length)}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-medium">
                {projectInventoryImportText.previewTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {previewRows.length === 0
                  ? projectInventoryImportText.saveDisabledMessage
                  : projectInventoryImportText.previewSubtitle}
              </p>
            </div>

            {previewRows.length > 0 ? (
              <PreviewTable
                rows={previewRows}
                scope={scope}
                disabled={isBusy}
                onRowFieldChange={handleRowFieldChange}
              />
            ) : (
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="text-sm font-medium">
                  {projectInventoryImportText.emptyPreviewTitle}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {projectInventoryImportText.emptyPreviewDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isBusy}>
              {projectInventoryImportText.cancelButton}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={readyRows.length === 0 || isBusy}
            isLoading={isSaving}
          >
            {isSaving
              ? projectInventoryImportText.savingButton
              : projectInventoryImportText.saveButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Parses a CSV document into preview rows for the given scope (tool or material).
 * Rows for the other item type are counted as skipped rather than validated,
 * since they belong to the other page's import.
 */
function parseInventoryCsv(
  csvText: string,
  scope: ImportItemType,
  projects: ImportProjectOption[],
): CsvParseResult {
  const lines = csvText
    .split(CSV_SPLIT_PATTERN)
    .filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return {
      errors: [projectInventoryImportText.errors.emptyFile],
      rows: [],
      skippedCount: 0,
    };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeCsvValue);
  const missingHeaders = PROJECT_INVENTORY_IMPORT_REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    return {
      errors: [
        projectInventoryImportText.errors.missingHeaders.replace(
          '{headers}',
          missingHeaders.join(', '),
        ),
      ],
      rows: [],
      skippedCount: 0,
    };
  }

  const fileErrors: string[] = [];
  let skippedCount = 0;
  const rows = lines.slice(1).flatMap((line, index) => {
    const result = mapCsvLineToPreviewRow(
      headers,
      parseCsvLine(line),
      index,
      scope,
      projects,
    );

    if (result.skipped) {
      skippedCount += 1;
      return [];
    }

    if (!result.row) {
      if (result.error) {
        fileErrors.push(result.error);
      }

      return [];
    }

    return [result.row];
  });

  return {
    errors: buildPreviewErrors(fileErrors),
    rows,
    skippedCount,
  };
}

/**
 * Parses a single CSV line with quoted cell support.
 */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let currentCell = EMPTY_CELL;
  let isInsideQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === CSV_QUOTE && nextCharacter === CSV_QUOTE) {
      currentCell += CSV_QUOTE;
      index += 1;
      continue;
    }

    if (character === CSV_QUOTE) {
      isInsideQuote = !isInsideQuote;
      continue;
    }

    if (character === CSV_CELL_SEPARATOR && !isInsideQuote) {
      cells.push(currentCell.trim());
      currentCell = EMPTY_CELL;
      continue;
    }

    currentCell += character;
  }

  cells.push(currentCell.trim());

  return cells;
}

/**
 * Converts a parsed CSV line into a preview row, or a skip when the row's
 * item type does not match the dialog's scope. A row with an unrecognized
 * item_type is left out entirely since there's no scope to build it under;
 * every other row is kept and made editable, even when a value is invalid.
 */
function mapCsvLineToPreviewRow(
  headers: string[],
  cells: string[],
  rowIndex: number,
  scope: ImportItemType,
  projects: ImportProjectOption[],
): { error: string | null; row: ImportPreviewRow | null; skipped: boolean } {
  const csvRow = headers.reduce<Record<string, string>>(
    (result, header, index) => ({
      ...result,
      [header]: cells[index]?.trim() ?? EMPTY_CELL,
    }),
    {},
  );
  const itemType = normalizeCsvValue(
    csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.itemType],
  );

  if (!isImportItemType(itemType)) {
    return {
      error: projectInventoryImportText.errors.unknownItemType,
      row: null,
      skipped: false,
    };
  }

  if (itemType !== scope) {
    return { error: null, row: null, skipped: true };
  }

  return {
    error: null,
    skipped: false,
    row: buildPreviewRow({
      itemType,
      projectName:
        csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.projectName]?.trim() ?? '',
      name: csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.name]?.trim() ?? '',
      rawStatus:
        csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.status]?.trim() ?? '',
      rawCondition:
        csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.condition]?.trim() ?? '',
      rawQuantity:
        csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.quantity]?.trim() ?? '',
      rawUnitCost:
        csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.unitCost]?.trim() ?? '',
      notes: csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.notes]?.trim() ?? '',
      rowId: `${itemType}${ROW_ID_SEPARATOR}${rowIndex}`,
      projects,
    }),
  };
}

/**
 * Maps an extraction draft into preview rows, running every row through the
 * same normalization and validation the CSV path uses. The draft only ever
 * carries the item type that was requested, so every row is kept and made
 * editable rather than dropped when a value is invalid.
 */
function buildPreviewRowsFromExtractionDraft(
  draft: ProjectInventoryExtractionDraft,
  projects: ImportProjectOption[],
): ImportPreviewRow[] {
  const projectName = draft.projectName?.trim() ?? '';

  if (draft.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL) {
    return draft.tools.map((tool, index) =>
      buildPreviewRow({
        itemType: PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL,
        projectName,
        name: tool.name?.trim() ?? '',
        rawStatus: tool.status?.trim() ?? '',
        rawCondition: tool.condition?.trim() ?? '',
        rawQuantity: EMPTY_CELL,
        rawUnitCost: EMPTY_CELL,
        notes: tool.notes?.trim() ?? '',
        rowId: `ocr-tool${ROW_ID_SEPARATOR}${index}`,
        projects,
      }),
    );
  }

  return draft.materials.map((material, index) =>
    buildPreviewRow({
      itemType: PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL,
      projectName,
      name: material.name?.trim() ?? '',
      rawStatus: EMPTY_CELL,
      rawCondition: EMPTY_CELL,
      rawQuantity: material.quantity != null ? String(material.quantity) : '',
      rawUnitCost: material.unitCost != null ? String(material.unitCost) : '',
      notes: material.notes?.trim() ?? '',
      rowId: `ocr-material${ROW_ID_SEPARATOR}${index}`,
      projects,
    }),
  );
}

type BuildPreviewRowInput = {
  itemType: ImportItemType;
  projectName: string;
  name: string;
  rawStatus: string;
  rawCondition: string;
  rawQuantity: string;
  rawUnitCost: string;
  notes: string;
  rowId: string;
  projects: ImportProjectOption[];
};

/**
 * Resolves a raw project name to a known project, case/whitespace-insensitively.
 * An empty name resolves to org inventory (matched); a non-empty name with no
 * match is left unmatched so the row is blocked until the user fixes it.
 */
function resolveRowProject(
  projectName: string,
  projects: ImportProjectOption[],
): { projectId: string | null; projectMatched: boolean } {
  const trimmedName = projectName.trim();

  if (!trimmedName) {
    return { projectId: null, projectMatched: true };
  }

  const match = projects.find(
    (project) =>
      normalizeCsvValue(project.name) === normalizeCsvValue(trimmedName),
  );

  return match
    ? { projectId: match.id, projectMatched: true }
    : { projectId: null, projectMatched: false };
}

/**
 * Normalizes a single draft row into a preview row. The row is always
 * returned, even when a value is missing or unrecognized — invalid fields are
 * left blank (rather than the original bad text) so they render as an empty,
 * editable select or input, and `rowError` records what still needs fixing.
 */
function buildPreviewRow(input: BuildPreviewRowInput): ImportPreviewRow {
  const {
    itemType,
    projectName,
    name,
    rawStatus,
    rawCondition,
    rawQuantity,
    rawUnitCost,
    notes,
    rowId,
    projects,
  } = input;

  const { projectId, projectMatched } = resolveRowProject(
    projectName,
    projects,
  );

  const baseRow = {
    id: rowId,
    itemType,
    projectName,
    projectId,
    projectMatched,
    name,
    notes,
  };

  const row: ImportPreviewRow =
    itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL
      ? {
          ...baseRow,
          quantity: EMPTY_CELL,
          unitCost: EMPTY_CELL,
          status: rawStatus
            ? (normalizeToolStatus(rawStatus) ?? EMPTY_CELL)
            : PROJECT_INVENTORY_IMPORT.DEFAULTS.TOOL_STATUS,
          condition: rawCondition
            ? (normalizeToolCondition(rawCondition) ?? EMPTY_CELL)
            : PROJECT_INVENTORY_IMPORT.DEFAULTS.TOOL_CONDITION,
          rowError: null,
        }
      : {
          ...baseRow,
          quantity: rawQuantity,
          unitCost: rawUnitCost,
          status: EMPTY_CELL,
          condition: EMPTY_CELL,
          rowError: null,
        };

  return { ...row, rowError: validateRow(row) };
}

/**
 * Single source of truth for whether a preview row is ready to import,
 * shared by initial parsing and by inline edits in the preview table.
 */
function validateRow(row: ImportPreviewRow): string | null {
  if (!row.projectMatched) {
    return projectInventoryImportText.errors.unmatchedProject;
  }

  if (!row.name.trim()) {
    return projectInventoryImportText.errors.missingName;
  }

  if (row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL) {
    if (!row.status) {
      return projectInventoryImportText.errors.unknownToolStatus;
    }

    if (!row.condition) {
      return projectInventoryImportText.errors.unknownToolCondition;
    }

    return null;
  }

  const quantity = row.quantity.trim() === '' ? NaN : Number(row.quantity);

  if (!Number.isFinite(quantity) || quantity < 0) {
    return projectInventoryImportText.errors.missingMaterialQuantity;
  }

  const unitCost = row.unitCost.trim() === '' ? NaN : Number(row.unitCost);

  if (!Number.isFinite(unitCost) || unitCost <= 0) {
    return projectInventoryImportText.errors.missingMaterialUnitCost;
  }

  return null;
}

/**
 * Checks whether the uploaded file can be handled by the CSV preview parser.
 */
function isCsvFile(file: File) {
  return (
    file.name
      .toLowerCase()
      .endsWith(PROJECT_INVENTORY_IMPORT.FILES.CSV_EXTENSION) ||
    PROJECT_INVENTORY_IMPORT.FILES.CSV_MIME_TYPES.includes(
      file.type as (typeof PROJECT_INVENTORY_IMPORT.FILES.CSV_MIME_TYPES)[number],
    )
  );
}

/**
 * Checks whether a file can be sent through the OCR extraction path.
 */
function isOcrFile(file: File) {
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
 * Normalizes imported values for matching and enum-style comparisons.
 */
function normalizeCsvValue(value: string | undefined) {
  return value?.trim().toLowerCase() ?? EMPTY_CELL;
}

/**
 * Narrows imported row types to the preview row contract.
 */
function isImportItemType(value: string): value is ImportItemType {
  return (
    value === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL ||
    value === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL
  );
}

/**
 * Limits repeated row errors while preserving useful feedback.
 */
function buildPreviewErrors(errors: string[]) {
  if (errors.length === 0) {
    return [];
  }

  return [
    projectInventoryImportText.errors.invalidRows.replace(
      '{count}',
      String(errors.length),
    ),
    ...Array.from(new Set(errors)).slice(
      0,
      PROJECT_INVENTORY_IMPORT.PREVIEW.MAX_ERROR_COUNT,
    ),
  ];
}

type ImportFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function ImportField({ label, htmlFor, children }: ImportFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

type ImportSummaryTileProps = {
  label: string;
  value: string;
};

function ImportSummaryTile({ label, value }: ImportSummaryTileProps) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

type OcrStatusProps = {
  isExtracting: boolean;
  hasSucceeded: boolean;
};

/**
 * Shows the current state of the OCR extraction as an icon + short message,
 * so the state reads at a glance instead of requiring the text to be read.
 */
function OcrStatus({ isExtracting, hasSucceeded }: OcrStatusProps) {
  if (isExtracting) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        <span>{projectInventoryImportText.ocrExtracting}</span>
      </div>
    );
  }

  if (hasSucceeded) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-foreground">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <span>{projectInventoryImportText.ocrExtractSuccess}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      {projectInventoryImportText.ocrIdleHint}
    </div>
  );
}

type PreviewTableProps = {
  rows: ImportPreviewRow[];
  scope: ImportItemType;
  disabled: boolean;
  onRowFieldChange: (
    rowId: string,
    patch: Partial<
      Pick<
        ImportPreviewRow,
        'name' | 'status' | 'condition' | 'quantity' | 'unitCost'
      >
    >,
  ) => void;
};

/**
 * Editable preview table. Columns match the dialog's scope (tool or
 * material) since every visible row shares that scope. Rows with a problem
 * are tinted and editable in place instead of being dropped from the file.
 */
function PreviewTable({
  rows,
  scope,
  disabled,
  onRowFieldChange,
}: PreviewTableProps) {
  const isToolScope = scope === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">
            {projectInventoryImportText.readyBadge}
          </TableHead>
          <TableHead>
            {projectInventoryImportText.tableColumns.project}
          </TableHead>
          <TableHead>{projectInventoryImportText.tableColumns.name}</TableHead>
          {isToolScope ? (
            <>
              <TableHead>
                {projectInventoryImportText.tableColumns.status}
              </TableHead>
              <TableHead>
                {projectInventoryImportText.tableColumns.condition}
              </TableHead>
            </>
          ) : (
            <>
              <TableHead>
                {projectInventoryImportText.tableColumns.quantity}
              </TableHead>
              <TableHead>
                {projectInventoryImportText.tableColumns.unitCost}
              </TableHead>
            </>
          )}
          <TableHead>{projectInventoryImportText.tableColumns.notes}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className={row.rowError ? 'bg-destructive/5' : undefined}
          >
            <TableCell>
              <div
                className="flex items-center gap-1.5"
                title={row.rowError ?? undefined}
              >
                {row.rowError ? (
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                ) : (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                )}
                <span className="text-xs text-muted-foreground">
                  {row.rowError
                    ? projectInventoryImportText.needsFixBadge
                    : projectInventoryImportText.readyBadge}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {row.projectName}
            </TableCell>
            <TableCell>
              <Input
                value={row.name}
                disabled={disabled}
                error={!row.name.trim()}
                onChange={(event) =>
                  onRowFieldChange(row.id, { name: event.target.value })
                }
              />
            </TableCell>
            {isToolScope ? (
              <>
                <TableCell>
                  <SelectField
                    options={TOOL_STATUS_OPTIONS}
                    value={row.status || undefined}
                    placeholder={projectInventoryImportText.statusPlaceholder}
                    disabled={disabled}
                    onChange={(value) =>
                      onRowFieldChange(row.id, { status: value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <SelectField
                    options={TOOL_CONDITION_OPTIONS}
                    value={row.condition || undefined}
                    placeholder={
                      projectInventoryImportText.conditionPlaceholder
                    }
                    disabled={disabled}
                    onChange={(value) =>
                      onRowFieldChange(row.id, { condition: value })
                    }
                  />
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={row.quantity}
                    disabled={disabled}
                    error={Boolean(row.rowError) && !row.quantity.trim()}
                    onChange={(event) =>
                      onRowFieldChange(row.id, { quantity: event.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    inputMode="decimal"
                    value={row.unitCost}
                    disabled={disabled}
                    error={Boolean(row.rowError) && !row.unitCost.trim()}
                    onChange={(event) =>
                      onRowFieldChange(row.id, { unitCost: event.target.value })
                    }
                  />
                </TableCell>
              </>
            )}
            <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
              {row.notes}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
