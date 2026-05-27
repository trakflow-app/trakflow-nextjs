'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FolderOpen,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  deleteToolAction,
  updateToolAction,
} from '@/app/services/tools-services';
import AppImage from '@/components/ui/app-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectRow } from '@/lib/dal/projects';
import type { ToolAssignmentType, ToolRow, ToolStatus } from '@/lib/dal/tools';
import { showToast } from '@/lib/toast';
import {
  TOOL_CONDITION_LABELS,
  TOOL_DELETE_TEXT,
  TOOL_DETAILS_TEXT,
  TOOL_EDIT_TEXT,
  TOOLS_CARD_TEXT,
  TOOLS_PAGINATION_TEXT,
  TOOLS_PAGE_TEXT,
  TOOLS_ACTION_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';
import type { Database } from '@/lib/types/database.types';

type FilterValue = 'all' | ToolStatus;
type TypeFilterValue = 'all' | ToolAssignmentType;
type ProjectFilterValue = 'all' | 'inventory' | string;
type ToolCondition = Database['public']['Enums']['tool_condition'];
type ToolProject = Pick<ProjectRow, 'id' | 'project_name'>;

type ToolsListProps = {
  tools: ToolRow[];
  projects: ToolProject[];
};

const FILTER_ALL = 'all';
const INVENTORY_PROJECT_VALUE = 'inventory';
const IMAGE_PLACEHOLDER_SIZE = 48;
const FIRST_PAGE = 1;
const MIN_TAG_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 6;
const PAGE_SIZE_SMALL = 6;
const PAGE_SIZE_MEDIUM = 12;
const PAGE_SIZE_LARGE = 24;
const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { label: String(PAGE_SIZE_SMALL), value: String(PAGE_SIZE_SMALL) },
  { label: String(PAGE_SIZE_MEDIUM), value: String(PAGE_SIZE_MEDIUM) },
  { label: String(PAGE_SIZE_LARGE), value: String(PAGE_SIZE_LARGE) },
];
const PAGE_SUMMARY_CURRENT_TOKEN = '{currentPage}';
const PAGE_SUMMARY_TOTAL_TOKEN = '{totalPages}';
const TOOL_FORM_KEYS = {
  id: 'id',
  name: 'name',
  tagNumber: 'tagNumber',
  status: 'status',
  condition: 'condition',
  projectId: 'projectId',
  notes: 'notes',
} as const;

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: TOOLS_PAGE_TEXT.allStatuses, value: FILTER_ALL },
  ...Object.entries(TOOL_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const TYPE_FILTER_OPTIONS: SelectOption[] = [
  { label: TOOLS_PAGE_TEXT.allTypes, value: FILTER_ALL },
  { label: TOOLS_PAGE_TEXT.inventoryType, value: 'INVENTORY' },
  { label: TOOLS_PAGE_TEXT.assignedType, value: 'ASSIGNED' },
];

const STATUS_EDIT_OPTIONS: SelectOption[] = Object.entries(
  TOOL_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

const CONDITION_EDIT_OPTIONS: SelectOption[] = Object.entries(
  TOOL_CONDITION_LABELS,
).map(([value, label]) => ({ value, label }));

const STATUS_VARIANTS: Record<
  ToolStatus,
  'secondary' | 'outline' | 'destructive'
> = {
  AVAILABLE: 'secondary',
  CHECKEDOUT: 'outline',
  OUT_OF_SERVICE: 'destructive',
  ARCHIVED: 'outline',
};

/**
 * Client-side tools card grid with search, filters, pagination, and tool actions.
 */
export function ToolsList({ tools, projects }: ToolsListProps) {
  const router = useRouter();
  const [toolsList, setToolsList] = useState(tools);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(FILTER_ALL);
  const [projectFilter, setProjectFilter] =
    useState<ProjectFilterValue>(FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedTool, setSelectedTool] = useState<ToolRow | null>(null);
  const [toolToEdit, setToolToEdit] = useState<ToolRow | null>(null);
  const [toolToDelete, setToolToDelete] = useState<ToolRow | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setToolsList(tools);
  }, [tools]);

  const projectOptions = useMemo<SelectOption[]>(
    () => [
      { label: TOOLS_PAGE_TEXT.allProjects, value: FILTER_ALL },
      { label: TOOLS_PAGE_TEXT.inventoryType, value: INVENTORY_PROJECT_VALUE },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  const filteredTools = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return toolsList.filter((tool) => {
      const matchesSearch =
        !normalizedSearch || tool.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === FILTER_ALL || tool.status === statusFilter;
      const matchesType = typeFilter === FILTER_ALL || tool.type === typeFilter;
      const matchesProject =
        projectFilter === FILTER_ALL ||
        (projectFilter === INVENTORY_PROJECT_VALUE && !tool.projectId) ||
        tool.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesType && matchesProject;
    });
  }, [projectFilter, search, statusFilter, toolsList, typeFilter]);

  const totalPages = Math.max(
    FIRST_PAGE,
    Math.ceil(filteredTools.length / pageSize),
  );
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (normalizedCurrentPage - FIRST_PAGE) * pageSize;
  const paginatedTools = filteredTools.slice(
    pageStartIndex,
    pageStartIndex + pageSize,
  );
  const pageSummary = TOOLS_PAGINATION_TEXT.summary
    .replace(PAGE_SUMMARY_CURRENT_TOKEN, String(normalizedCurrentPage))
    .replace(PAGE_SUMMARY_TOTAL_TOKEN, String(totalPages));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function resetPagination() {
    setCurrentPage(FIRST_PAGE);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetPagination();
  }

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value as FilterValue);
    resetPagination();
  }

  function handleTypeFilterChange(value: string) {
    setTypeFilter(value as TypeFilterValue);
    resetPagination();
  }

  function handleProjectFilterChange(value: string) {
    setProjectFilter(value as ProjectFilterValue);
    resetPagination();
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    resetPagination();
  }

  function getProjectName(projectId: string | null): string {
    if (!projectId) {
      return TOOLS_PAGE_TEXT.inventoryType;
    }

    return (
      projects.find((project) => project.id === projectId)?.project_name ??
      TOOLS_PAGE_TEXT.inventoryType
    );
  }

  function handleToolUpdated(updatedTool: ToolRow) {
    setToolsList((currentTools) =>
      currentTools.map((tool) =>
        tool.id === updatedTool.id ? updatedTool : tool,
      ),
    );
    setSelectedTool((tool) =>
      tool?.id === updatedTool.id ? updatedTool : tool,
    );
    setToolToEdit(null);
    router.refresh();
  }

  function handleToolDeleted(toolId: string) {
    setToolsList((currentTools) =>
      currentTools.filter((tool) => tool.id !== toolId),
    );
    setSelectedTool((tool) => (tool?.id === toolId ? null : tool));
    setToolToDelete(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex w-full flex-col gap-3">
        <div className="w-full">
          <Input
            type="search"
            placeholder={TOOLS_PAGE_TEXT.searchPlaceholder}
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <SelectField
            className="w-full"
            options={projectOptions}
            value={projectFilter}
            onChange={handleProjectFilterChange}
            placeholder={TOOLS_PAGE_TEXT.projectFilterPlaceholder}
          />
          <SelectField
            className="w-full"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            placeholder={TOOLS_PAGE_TEXT.statusFilterPlaceholder}
          />
          <SelectField
            className="w-full"
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={handleTypeFilterChange}
            placeholder={TOOLS_PAGE_TEXT.typeFilterPlaceholder}
          />
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={TOOLS_PAGE_TEXT.noToolsTitle}
          description={TOOLS_PAGE_TEXT.noToolsDescription}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onView={() => setSelectedTool(tool)}
                onEdit={() => setToolToEdit(tool)}
                onDelete={() => setToolToDelete(tool)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {TOOLS_PAGINATION_TEXT.pageSizeLabel}
              </span>
              <SelectField
                options={PAGE_SIZE_OPTIONS}
                value={String(pageSize)}
                onChange={handlePageSizeChange}
                placeholder={TOOLS_PAGINATION_TEXT.pageSizeLabel}
                className="w-20"
              />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm text-muted-foreground">
                {pageSummary}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={normalizedCurrentPage === FIRST_PAGE}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(FIRST_PAGE, page - 1))
                  }
                >
                  <ChevronLeft data-icon="inline-start" />
                  {TOOLS_PAGINATION_TEXT.previousButton}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={normalizedCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  {TOOLS_PAGINATION_TEXT.nextButton}
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToolDetailsDialog
        tool={selectedTool}
        onEdit={(tool) => {
          setSelectedTool(null);
          setToolToEdit(tool);
        }}
        onDelete={(tool) => {
          setSelectedTool(null);
          setToolToDelete(tool);
        }}
        onOpenChange={(open) => {
          if (!open) setSelectedTool(null);
        }}
      />
      <ToolEditDialog
        tool={toolToEdit}
        projects={projects}
        isPending={isPending}
        getProjectName={getProjectName}
        onToolUpdated={handleToolUpdated}
        onOpenChange={(open) => {
          if (!open) setToolToEdit(null);
        }}
        startTransition={startTransition}
      />
      <ToolDeleteDialog
        tool={toolToDelete}
        isPending={isPending}
        onToolDeleted={handleToolDeleted}
        onOpenChange={(open) => {
          if (!open) setToolToDelete(null);
        }}
        startTransition={startTransition}
      />
    </div>
  );
}

type ToolCardProps = {
  tool: ToolRow;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * Displays a single tool as a project-style card.
 */
function ToolCard({ tool, onView, onEdit, onDelete }: ToolCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <ToolImage tool={tool} />
        <div className="flex items-center justify-between gap-2">
          <Badge variant={STATUS_VARIANTS[tool.status]}>
            {TOOL_STATUS_LABELS[tool.status]}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {TOOLS_CARD_TEXT.tagPrefix} {tool.tagNumber}
          </span>
        </div>
        <CardTitle className="text-base">{tool.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pb-4">
        <ToolMetaRow
          label={
            tool.type === 'ASSIGNED'
              ? TOOLS_CARD_TEXT.assignedProjectLabel
              : TOOLS_CARD_TEXT.inventoryProjectLabel
          }
          value={tool.projectName}
        />
        <ToolMetaRow
          label={TOOLS_CARD_TEXT.conditionHeader}
          value={TOOL_CONDITION_LABELS[tool.condition]}
        />
      </CardContent>

      <CardFooter className="flex gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onView}>
          <Eye data-icon="inline-start" />
          {TOOLS_CARD_TEXT.viewAction}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={onEdit}>
          <Edit2 data-icon="inline-start" />
          {TOOLS_CARD_TEXT.editAction}
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={onDelete}
        >
          <Trash2 data-icon="inline-start" />
          {TOOLS_CARD_TEXT.deleteAction}
        </Button>
      </CardFooter>
    </Card>
  );
}

type ToolMetaRowProps = {
  label: string;
  value: string;
};

function ToolMetaRow({ label, value }: ToolMetaRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}

type ToolImageProps = {
  tool: ToolRow;
};

function ToolImage({ tool }: ToolImageProps) {
  if (tool.imagePath) {
    return (
      <AppImage
        src={tool.imagePath}
        alt={tool.name}
        aspectRatio="video"
        rounded="md"
        className="bg-muted"
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Wrench size={IMAGE_PLACEHOLDER_SIZE} strokeWidth={1.5} />
        <span className="text-xs font-medium">
          {TOOL_DETAILS_TEXT.noImageLabel}
        </span>
      </div>
    </div>
  );
}

type ToolDetailsDialogProps = {
  tool: ToolRow | null;
  onEdit: (tool: ToolRow) => void;
  onDelete: (tool: ToolRow) => void;
  onOpenChange: (open: boolean) => void;
};

function ToolDetailsDialog({
  tool,
  onEdit,
  onDelete,
  onOpenChange,
}: ToolDetailsDialogProps) {
  return (
    <Dialog open={Boolean(tool)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_DETAILS_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_DETAILS_TEXT.description}</DialogDescription>
        </DialogHeader>

        {tool ? (
          <div className="flex flex-col gap-4">
            <ToolImage tool={tool} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem
                label={TOOL_DETAILS_TEXT.tagLabel}
                value={`${TOOLS_CARD_TEXT.tagPrefix} ${tool.tagNumber}`}
              />
              <DetailItem
                label={TOOL_DETAILS_TEXT.nameLabel}
                value={tool.name}
              />
              <DetailItem
                label={TOOL_DETAILS_TEXT.typeLabel}
                value={
                  tool.type === 'ASSIGNED'
                    ? TOOLS_PAGE_TEXT.assignedType
                    : TOOLS_PAGE_TEXT.inventoryType
                }
              />
              <DetailItem
                label={TOOL_DETAILS_TEXT.projectLabel}
                value={tool.projectName}
              />
              <DetailItem
                label={TOOL_DETAILS_TEXT.statusLabel}
                value={TOOL_STATUS_LABELS[tool.status]}
              />
              <DetailItem
                label={TOOL_DETAILS_TEXT.conditionLabel}
                value={TOOL_CONDITION_LABELS[tool.condition]}
              />
            </div>
            <DetailItem
              label={TOOL_DETAILS_TEXT.notesLabel}
              value={tool.notes || TOOL_DETAILS_TEXT.noNotes}
            />
          </div>
        ) : null}

        <DialogFooter>
          {tool ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  onDelete(tool);
                }}
              >
                <Trash2 data-icon="inline-start" />
                {TOOLS_CARD_TEXT.deleteAction}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(tool);
                }}
              >
                <Edit2 data-icon="inline-start" />
                {TOOLS_CARD_TEXT.editAction}
              </Button>
            </>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {TOOL_DETAILS_TEXT.closeButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

type ToolEditDialogProps = {
  tool: ToolRow | null;
  projects: ToolProject[];
  isPending: boolean;
  getProjectName: (projectId: string | null) => string;
  onToolUpdated: (tool: ToolRow) => void;
  onOpenChange: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
};

function ToolEditDialog({
  tool,
  projects,
  isPending,
  getProjectName,
  onToolUpdated,
  onOpenChange,
  startTransition,
}: ToolEditDialogProps) {
  const [status, setStatus] = useState<ToolStatus>('AVAILABLE');
  const [condition, setCondition] = useState<ToolCondition>('GOOD');
  const [projectId, setProjectId] = useState(INVENTORY_PROJECT_VALUE);
  const projectOptions = useMemo<SelectOption[]>(
    () => [
      { label: TOOLS_PAGE_TEXT.inventoryType, value: INVENTORY_PROJECT_VALUE },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  useEffect(() => {
    if (!tool) {
      return;
    }

    setStatus(tool.status);
    setCondition(tool.condition);
    setProjectId(tool.projectId ?? INVENTORY_PROJECT_VALUE);
  }, [tool]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tool) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set(TOOL_FORM_KEYS.id, tool.id);
    formData.set(TOOL_FORM_KEYS.status, status);
    formData.set(TOOL_FORM_KEYS.condition, condition);
    formData.set(TOOL_FORM_KEYS.projectId, projectId);

    startTransition(() => {
      void (async () => {
        const result = await updateToolAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        const tagNumberValue = formData.get(TOOL_FORM_KEYS.tagNumber);
        const nameValue = formData.get(TOOL_FORM_KEYS.name);
        const notesValue = formData.get(TOOL_FORM_KEYS.notes);
        const nextProjectId =
          projectId === INVENTORY_PROJECT_VALUE ? null : projectId;
        const updatedTool: ToolRow = {
          ...tool,
          name: typeof nameValue === 'string' ? nameValue.trim() : tool.name,
          tagNumber:
            typeof tagNumberValue === 'string'
              ? Number(tagNumberValue)
              : tool.tagNumber,
          status,
          condition,
          projectId: nextProjectId,
          projectName: getProjectName(nextProjectId),
          type: nextProjectId ? 'ASSIGNED' : 'INVENTORY',
          notes:
            typeof notesValue === 'string' && notesValue.trim().length > 0
              ? notesValue.trim()
              : null,
        };

        showToast(TOOLS_ACTION_TEXT.updateSuccess, 'success');
        onToolUpdated(updatedTool);
      })();
    });
  }

  return (
    <Dialog open={Boolean(tool)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_EDIT_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_EDIT_TEXT.description}</DialogDescription>
        </DialogHeader>

        {tool ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolFormField
                label={TOOL_EDIT_TEXT.nameLabel}
                htmlFor={TOOL_FORM_KEYS.name}
              >
                <Input
                  id={TOOL_FORM_KEYS.name}
                  name={TOOL_FORM_KEYS.name}
                  defaultValue={tool.name}
                  required
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.tagNumberLabel}
                htmlFor={TOOL_FORM_KEYS.tagNumber}
              >
                <Input
                  id={TOOL_FORM_KEYS.tagNumber}
                  name={TOOL_FORM_KEYS.tagNumber}
                  type="number"
                  min={MIN_TAG_NUMBER}
                  defaultValue={tool.tagNumber}
                  required
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.projectLabel}
                htmlFor={TOOL_FORM_KEYS.projectId}
              >
                <SelectField
                  id={TOOL_FORM_KEYS.projectId}
                  options={projectOptions}
                  value={projectId}
                  onChange={setProjectId}
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.statusLabel}
                htmlFor={TOOL_FORM_KEYS.status}
              >
                <SelectField
                  id={TOOL_FORM_KEYS.status}
                  options={STATUS_EDIT_OPTIONS}
                  value={status}
                  onChange={(value) => setStatus(value as ToolStatus)}
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.conditionLabel}
                htmlFor={TOOL_FORM_KEYS.condition}
              >
                <SelectField
                  id={TOOL_FORM_KEYS.condition}
                  options={CONDITION_EDIT_OPTIONS}
                  value={condition}
                  onChange={(value) => setCondition(value as ToolCondition)}
                />
              </ToolFormField>
            </div>
            <ToolFormField
              label={TOOL_EDIT_TEXT.notesLabel}
              htmlFor={TOOL_FORM_KEYS.notes}
            >
              <Textarea
                id={TOOL_FORM_KEYS.notes}
                name={TOOL_FORM_KEYS.notes}
                defaultValue={tool.notes ?? ''}
              />
            </ToolFormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                {TOOL_EDIT_TEXT.cancelButton}
              </Button>
              <Button type="submit" disabled={isPending}>
                {TOOL_EDIT_TEXT.saveButton}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ToolDeleteDialogProps = {
  tool: ToolRow | null;
  isPending: boolean;
  onToolDeleted: (toolId: string) => void;
  onOpenChange: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
};

function ToolDeleteDialog({
  tool,
  isPending,
  onToolDeleted,
  onOpenChange,
  startTransition,
}: ToolDeleteDialogProps) {
  function handleDelete() {
    if (!tool) {
      return;
    }

    const formData = new FormData();
    formData.set(TOOL_FORM_KEYS.id, tool.id);

    startTransition(() => {
      void (async () => {
        const result = await deleteToolAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.deleteSuccess, 'success');
        onToolDeleted(tool.id);
      })();
    });
  }

  return (
    <Dialog open={Boolean(tool)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TOOL_DELETE_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_DELETE_TEXT.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {TOOL_DELETE_TEXT.cancelButton}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2 data-icon="inline-start" />
            {TOOL_DELETE_TEXT.confirmButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ToolFormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function ToolFormField({ label, htmlFor, children }: ToolFormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
