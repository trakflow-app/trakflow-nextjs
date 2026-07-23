'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Sparkles, Upload } from 'lucide-react';
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
} from '@/constants/components/import/project-inventory-import-constants';
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

type ImportProjectOption = {
  id: string;
  name: string;
};

type ImportItemType =
  (typeof PROJECT_INVENTORY_IMPORT.ITEM_TYPES)[keyof typeof PROJECT_INVENTORY_IMPORT.ITEM_TYPES];

type ImportPreviewRow = {
  id: string;
  itemType: ImportItemType;
  projectName: string;
  name: string;
  quantity: string;
  unitCost: string;
  condition: string;
  status: string;
  notes: string;
};

type CsvParseResult = {
  errors: string[];
  rows: ImportPreviewRow[];
};

type ProjectInventoryImportDialogProps = {
  projects: ImportProjectOption[];
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
}: ProjectInventoryImportDialogProps) {
  const router = useRouter();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const ocrInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [ocrFileName, setOcrFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isExtracting, startExtractTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const isBusy = isExtracting || isSaving;

  const toolCount = previewRows.filter(
    (row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL,
  ).length;
  const materialCount = previewRows.filter(
    (row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL,
  ).length;
  const detectedProjectName = previewRows[0]?.projectName ?? '';
  const matchedProject = useMemo(
    () =>
      projects.find(
        (project) =>
          normalizeCsvValue(project.name) ===
          normalizeCsvValue(detectedProjectName),
      ),
    [detectedProjectName, projects],
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

    if (!isCsvFile(file)) {
      setPreviewRows([]);
      setErrors([projectInventoryImportText.errors.unsupportedFile]);
      return;
    }

    try {
      const csvText = await file.text();
      const result = parseInventoryCsv(csvText);
      setPreviewRows(result.rows);
      setErrors(result.errors);
    } catch {
      setPreviewRows([]);
      setErrors([projectInventoryImportText.errors.readFailed]);
    }
  }

  /**
   * Sends the selected document to Gemini and populates the preview from the draft it returns.
   */
  function handleOcrFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setOcrFileName('');
      return;
    }

    setOcrFileName(file.name);
    setCsvFileName('');

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
        const result = await extractProjectInventoryFromDocument(formData);

        if (!result.draft) {
          setErrors([result.error]);
          return;
        }

        const parsed = buildPreviewRowsFromExtractionDraft(result.draft);
        setPreviewRows(parsed.rows);
        setErrors(parsed.errors);
      })();
    });
  }

  /**
   * Saves the reviewed draft rows as tools and materials.
   */
  function handleSave() {
    const nameById = new Map(previewRows.map((row) => [row.id, row.name]));
    const toolsPayload = previewRows
      .filter((row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL)
      .map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        condition: row.condition,
        notes: row.notes || null,
      }));
    const materialsPayload = previewRows
      .filter(
        (row) => row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL,
      )
      .map((row) => ({
        id: row.id,
        name: row.name,
        quantity: Number(row.quantity),
        unitCost: Number(row.unitCost),
      }));

    startSaveTransition(() => {
      void (async () => {
        const result = await importProjectInventoryAction({
          projectId: matchedProject?.id ?? null,
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
                <code className="block truncate rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
                  {projectInventoryImportText.templateExample}
                </code>
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
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {isExtracting
                  ? projectInventoryImportText.ocrExtracting
                  : ocrFileName && errors.length === 0
                    ? projectInventoryImportText.ocrExtractSuccess
                    : projectInventoryImportText.ocrIdleHint}
              </div>
            </div>
          </div>

          {errors.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {errors.map((error) => (
                <span key={error}>{error}</span>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <ImportSummaryTile
              label={projectInventoryImportText.detectedProjectLabel}
              value={
                detectedProjectName ||
                projectInventoryImportText.noProjectDetected
              }
            />
            <ImportSummaryTile
              label={projectInventoryImportText.matchedProjectLabel}
              value={
                matchedProject?.name ??
                projectInventoryImportText.noProjectMatch
              }
            />
            <ImportSummaryTile
              label={projectInventoryImportText.toolCountLabel}
              value={String(toolCount)}
            />
            <ImportSummaryTile
              label={projectInventoryImportText.materialCountLabel}
              value={String(materialCount)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-medium">
                {projectInventoryImportText.previewTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {previewRows.length === 0
                  ? projectInventoryImportText.saveDisabledMessage
                  : materialCount > 0
                    ? projectInventoryImportText.materialNotesUnsupported
                    : null}
              </p>
            </div>

            {previewRows.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {projectInventoryImportText.tableColumns.type}
                    </TableHead>
                    <TableHead>
                      {projectInventoryImportText.tableColumns.project}
                    </TableHead>
                    <TableHead>
                      {projectInventoryImportText.tableColumns.name}
                    </TableHead>
                    <TableHead>
                      {projectInventoryImportText.tableColumns.details}
                    </TableHead>
                    <TableHead>
                      {projectInventoryImportText.tableColumns.notes}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getItemTypeLabel(row.itemType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.projectName}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{getRowDetails(row)}</TableCell>
                      <TableCell className="max-w-56 truncate">
                        {row.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            disabled={previewRows.length === 0 || isBusy}
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
 * Parses a CSV document into tool and material preview rows.
 */
function parseInventoryCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .split(CSV_SPLIT_PATTERN)
    .filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return {
      errors: [projectInventoryImportText.errors.emptyFile],
      rows: [],
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
    };
  }

  const errors: string[] = [];
  const rows = lines.slice(1).flatMap((line, index) => {
    const row = mapCsvLineToPreviewRow(headers, parseCsvLine(line), index);

    if (!row.row) {
      if (row.error) {
        errors.push(row.error);
      }

      return [];
    }

    return [row.row];
  });

  return {
    errors: buildPreviewErrors(errors),
    rows,
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
 * Converts a parsed CSV line into a preview row or validation error.
 */
function mapCsvLineToPreviewRow(
  headers: string[],
  cells: string[],
  rowIndex: number,
): { error: string | null; row: ImportPreviewRow | null } {
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
  const name = csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.name]?.trim() ?? '';

  if (!name) {
    return {
      error: projectInventoryImportText.errors.missingName,
      row: null,
    };
  }

  if (!isImportItemType(itemType)) {
    return {
      error: projectInventoryImportText.errors.unknownItemType,
      row: null,
    };
  }

  return buildPreviewRow({
    itemType,
    projectName:
      csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.projectName]?.trim() ?? '',
    name,
    rawStatus: csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.status]?.trim() ?? '',
    rawCondition:
      csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.condition]?.trim() ?? '',
    rawQuantity:
      csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.quantity]?.trim() ?? '',
    rawUnitCost:
      csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.unitCost]?.trim() ?? '',
    notes: csvRow[PROJECT_INVENTORY_IMPORT.CSV_HEADERS.notes]?.trim() ?? '',
    rowId: `${itemType}${ROW_ID_SEPARATOR}${rowIndex}`,
  });
}

/**
 * Maps a Gemini extraction draft into preview rows, running every row through
 * the same normalization and validation the CSV path uses.
 */
function buildPreviewRowsFromExtractionDraft(
  draft: ProjectInventoryExtractionDraft,
): CsvParseResult {
  const errors: string[] = [];
  const rows: ImportPreviewRow[] = [];
  const projectName = draft.projectName?.trim() ?? '';

  draft.tools.forEach((tool, index) => {
    const name = tool.name?.trim() ?? '';

    if (!name) {
      errors.push(projectInventoryImportText.errors.missingName);
      return;
    }

    const result = buildPreviewRow({
      itemType: PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL,
      projectName,
      name,
      rawStatus: tool.status?.trim() ?? '',
      rawCondition: tool.condition?.trim() ?? '',
      rawQuantity: EMPTY_CELL,
      rawUnitCost: EMPTY_CELL,
      notes: tool.notes?.trim() ?? '',
      rowId: `ocr-tool${ROW_ID_SEPARATOR}${index}`,
    });

    if (result.row) {
      rows.push(result.row);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  draft.materials.forEach((material, index) => {
    const name = material.name?.trim() ?? '';

    if (!name) {
      errors.push(projectInventoryImportText.errors.missingName);
      return;
    }

    const result = buildPreviewRow({
      itemType: PROJECT_INVENTORY_IMPORT.ITEM_TYPES.MATERIAL,
      projectName,
      name,
      rawStatus: EMPTY_CELL,
      rawCondition: EMPTY_CELL,
      rawQuantity: material.quantity != null ? String(material.quantity) : '',
      rawUnitCost: material.unitCost != null ? String(material.unitCost) : '',
      notes: material.notes?.trim() ?? '',
      rowId: `ocr-material${ROW_ID_SEPARATOR}${index}`,
    });

    if (result.row) {
      rows.push(result.row);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  return { errors: buildPreviewErrors(errors), rows };
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
};

/**
 * Normalizes and validates a single draft row into a save-ready preview row.
 * Shared by the CSV parser and the Gemini extraction mapper so both producers
 * are held to the same rules before a row can reach the save action.
 */
function buildPreviewRow(
  input: BuildPreviewRowInput,
): { error: string | null; row: ImportPreviewRow | null } {
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
  } = input;

  if (itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL) {
    const status = rawStatus
      ? normalizeToolStatus(rawStatus)
      : PROJECT_INVENTORY_IMPORT.DEFAULTS.TOOL_STATUS;

    if (!status) {
      return {
        error: projectInventoryImportText.errors.unknownToolStatus.replace(
          '{name}',
          name,
        ),
        row: null,
      };
    }

    const condition = rawCondition
      ? normalizeToolCondition(rawCondition)
      : PROJECT_INVENTORY_IMPORT.DEFAULTS.TOOL_CONDITION;

    if (!condition) {
      return {
        error: projectInventoryImportText.errors.unknownToolCondition.replace(
          '{name}',
          name,
        ),
        row: null,
      };
    }

    return {
      error: null,
      row: {
        id: rowId,
        itemType,
        projectName,
        name,
        quantity: EMPTY_CELL,
        unitCost: EMPTY_CELL,
        condition,
        status,
        notes,
      },
    };
  }

  const quantity = rawQuantity.trim() === '' ? NaN : Number(rawQuantity);

  if (!Number.isFinite(quantity) || quantity < 0) {
    return {
      error: projectInventoryImportText.errors.missingMaterialQuantity.replace(
        '{name}',
        name,
      ),
      row: null,
    };
  }

  const unitCost = rawUnitCost.trim() === '' ? NaN : Number(rawUnitCost);

  if (!Number.isFinite(unitCost) || unitCost <= 0) {
    return {
      error: projectInventoryImportText.errors.missingMaterialUnitCost.replace(
        '{name}',
        name,
      ),
      row: null,
    };
  }

  return {
    error: null,
    row: {
      id: rowId,
      itemType,
      projectName,
      name,
      quantity: String(quantity),
      unitCost: String(unitCost),
      condition: EMPTY_CELL,
      status: EMPTY_CELL,
      notes,
    },
  };
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
 * Checks whether a file can be sent through the Gemini OCR extraction path.
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

/**
 * Returns the display label for a parsed import row type.
 */
function getItemTypeLabel(itemType: ImportItemType) {
  return projectInventoryImportText.itemTypeLabels[itemType];
}

/**
 * Builds the detail summary for a preview row.
 */
function getRowDetails(row: ImportPreviewRow) {
  if (row.itemType === PROJECT_INVENTORY_IMPORT.ITEM_TYPES.TOOL) {
    return projectInventoryImportText.rowDetails.tool
      .replace('{status}', row.status)
      .replace('{condition}', row.condition);
  }

  return projectInventoryImportText.rowDetails.material
    .replace('{quantity}', row.quantity)
    .replace('{unitCost}', row.unitCost);
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
