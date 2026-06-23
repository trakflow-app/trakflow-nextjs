'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Edit2,
  Eye,
  FolderOpen,
  RotateCcw,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import {
  checkoutToolAction,
  returnToolAction,
} from '@/app/services/tools-management-services';
import {
  deleteToolAction,
  updateToolAction,
} from '@/app/services/tools-services';
import {
  TOOL_CHECKOUT_CONDITION_OPTIONS,
  TOOL_CONDITION_OPTIONS,
  TOOL_PAGE_SIZE_OPTIONS,
  TOOLS_MANAGEMENT,
  TOOL_STATUS_FILTER_OPTIONS,
  TOOL_STATUS_OPTIONS,
  TOOL_STATUS_VARIANTS,
  TOOL_TYPE_FILTER_OPTIONS,
} from '@/constants/components/tools/tools-constants';
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
import type { ToolListFilters, ToolRow } from '@/lib/dal/tools';
import {
  compressToolCatalogImage,
  compressToolEvidenceImage,
} from '@/lib/image-compression';
import { showToast } from '@/lib/toast';
import { getToolDetailPath } from '@/lib/routes/tools';
import {
  TOOL_CHECKOUT_TEXT,
  TOOL_CONDITION_LABELS,
  TOOL_DELETE_TEXT,
  TOOL_DETAILS_TEXT,
  TOOL_EDIT_TEXT,
  TOOL_RETURN_TEXT,
  TOOLS_CARD_TEXT,
  TOOLS_PAGINATION_TEXT,
  TOOLS_PAGE_TEXT,
  TOOLS_ACTION_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';
import type { Database } from '@/lib/types/database.types';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

type ToolCondition = Database['public']['Enums']['tool_condition'];
type ToolStatus = Database['public']['Enums']['tool_status'];

/**
 * Minimal project fields needed by tool filters and edit forms.
 */
type ToolProject = Pick<ProjectRow, 'id' | 'project_name'>;

const EDIT_TOOL_IMAGE_INPUT_ID = `${TOOLS_MANAGEMENT.FORM_KEYS.imageFile}-edit`;
const RETURN_TOOL_IMAGE_INPUT_ID = `${TOOLS_MANAGEMENT.FORM_KEYS.returnImageFile}-return`;

type ToolsListProps = {
  canManageTools: boolean;
  filters: ToolListFilters;
  projects: ToolProject[];
  tools: ToolRow[];
  totalPages: number;
};

/**
 * Optimistic tool changes tied to the server snapshot they extend.
 */
type ToolOptimisticState = {
  deletedToolIds: Set<string>;
  overrides: Record<string, ToolRow>;
  serverTools: ToolRow[];
};

/**
 * Client-side tools card grid with search, filters, pagination, and tool actions.
 */
export function ToolsList({
  canManageTools,
  filters,
  projects,
  tools,
  totalPages,
}: ToolsListProps) {
  /**
   * State management
   */
  const router = useRouter();
  const [optimisticState, setOptimisticState] = useState<ToolOptimisticState>({
    deletedToolIds: new Set(),
    overrides: {},
    serverTools: tools,
  });
  const [toolToCheckout, setToolToCheckout] = useState<ToolRow | null>(null);
  const [toolToReturn, setToolToReturn] = useState<ToolRow | null>(null);
  const [toolToEdit, setToolToEdit] = useState<ToolRow | null>(null);
  const [toolToDelete, setToolToDelete] = useState<ToolRow | null>(null);
  const [isPending, startTransition] = useTransition();

  /**
   * Builds project filter options from the server-loaded project list.
   */
  const projectOptions = useMemo<SelectOption[]>(
    () => [
      {
        label: TOOLS_PAGE_TEXT.allProjects,
        value: TOOLS_MANAGEMENT.FILTERS.ALL,
      },
      {
        label: TOOLS_PAGE_TEXT.inventoryType,
        value: TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE,
      },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  /**
   * Applies optimistic edits/deletes over the server-loaded tools list.
   */
  const toolsList = useMemo(() => {
    const activeToolOverrides: Record<string, ToolRow> =
      optimisticState.serverTools === tools ? optimisticState.overrides : {};
    const activeDeletedToolIds =
      optimisticState.serverTools === tools
        ? optimisticState.deletedToolIds
        : new Set<string>();

    return tools
      .map((tool) => activeToolOverrides[tool.id] ?? tool)
      .filter((tool) => !activeDeletedToolIds.has(tool.id));
  }, [optimisticState, tools]);

  const normalizedCurrentPage = Math.min(filters.page, totalPages);
  const pageSummary = TOOLS_PAGINATION_TEXT.summary
    .replace(
      TOOLS_MANAGEMENT.PAGE_SUMMARY_TOKENS.CURRENT_PAGE,
      String(normalizedCurrentPage),
    )
    .replace(
      TOOLS_MANAGEMENT.PAGE_SUMMARY_TOKENS.TOTAL_PAGES,
      String(totalPages),
    );

  /**
   * Updates URL search params so the server returns the matching tool page.
   */
  const updateToolQueryParams = useCallback(
    (
      nextParams: Partial<ToolListFilters>,
      navigation: 'push' | 'replace' = 'push',
    ) => {
      // Build a complete query from the current filters and requested changes.
      const params = new URLSearchParams();
      const mergedFilters = {
        ...filters,
        ...nextParams,
      };

      // Include search only when it has a value.
      if (mergedFilters.search) {
        params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.search, mergedFilters.search);
      }

      // Include status only when it differs from the default.
      if (mergedFilters.status !== TOOLS_MANAGEMENT.FILTERS.ALL) {
        params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.status, mergedFilters.status);
      }

      // Include assignment type only when it differs from the default.
      if (mergedFilters.type !== TOOLS_MANAGEMENT.FILTERS.ALL) {
        params.set(TOOLS_MANAGEMENT.QUERY_PARAMS.type, mergedFilters.type);
      }

      // Include project only when it differs from the default.
      if (mergedFilters.project !== TOOLS_MANAGEMENT.FILTERS.ALL) {
        params.set(
          TOOLS_MANAGEMENT.QUERY_PARAMS.project,
          mergedFilters.project,
        );
      }

      // Include page only when it is not the first page.
      if (mergedFilters.page !== TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
        params.set(
          TOOLS_MANAGEMENT.QUERY_PARAMS.page,
          String(mergedFilters.page),
        );
      }

      // Include page size only when it differs from the default.
      if (mergedFilters.pageSize !== TOOLS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
        params.set(
          TOOLS_MANAGEMENT.QUERY_PARAMS.pageSize,
          String(mergedFilters.pageSize),
        );
      }

      // Build the destination from the validated query parameters.
      const queryString = params.toString();
      const path = queryString
        ? `${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}?${queryString}`
        : TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH;

      router[navigation](path);
    },
    [filters, router],
  );

  // Keep typing local and update the URL only after the debounce delay.
  const { inputValue: searchInput, setInputValue: setSearchInput } =
    useDebouncedSearch({
      serverValue: filters.search,
      debounceMs: TOOLS_MANAGEMENT.SEARCH_DEBOUNCE_MS,
      onDebouncedChange: (value) => {
        updateToolQueryParams(
          {
            page: TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
            search: value,
          },
          'replace',
        );
      },
    });

  function handleStatusFilterChange(value: string) {
    updateToolQueryParams({
      page: TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      status: value,
    });
  }

  function handleTypeFilterChange(value: string) {
    updateToolQueryParams({
      page: TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      type: value,
    });
  }

  function handleProjectFilterChange(value: string) {
    updateToolQueryParams({
      page: TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      project: value,
    });
  }

  function handlePageSizeChange(value: string) {
    updateToolQueryParams({
      page: TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      pageSize: Number(value),
    });
  }

  /**
   * Gets the display name for a tool's assigned project.
   */
  function getProjectName(projectId: string | null): string {
    if (!projectId) {
      return TOOLS_PAGE_TEXT.inventoryType;
    }

    return (
      projects.find((project) => project.id === projectId)?.project_name ??
      TOOLS_PAGE_TEXT.inventoryType
    );
  }

  /**
   * Callback when a tool is successfully updated.
   * Updates local state immediately, then refreshes server data.
   */
  function handleToolUpdated(updatedTool: ToolRow) {
    setOptimisticState((currentState) => ({
      deletedToolIds:
        currentState.serverTools === tools
          ? currentState.deletedToolIds
          : new Set(),
      overrides: {
        ...(currentState.serverTools === tools ? currentState.overrides : {}),
        [updatedTool.id]: updatedTool,
      },
      serverTools: tools,
    }));
    setToolToEdit(null);
    router.refresh();
  }

  /**
   * Callback when a tool is successfully deleted.
   * Removes the tool locally, then refreshes server data.
   */
  function handleToolDeleted(toolId: string) {
    setOptimisticState((currentState) => {
      const nextToolIds =
        currentState.serverTools === tools
          ? new Set(currentState.deletedToolIds)
          : new Set<string>();
      nextToolIds.add(toolId);

      return {
        deletedToolIds: nextToolIds,
        overrides:
          currentState.serverTools === tools ? currentState.overrides : {},
        serverTools: tools,
      };
    });
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
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <SelectField
            className="w-full"
            options={projectOptions}
            value={filters.project}
            onChange={handleProjectFilterChange}
            placeholder={TOOLS_PAGE_TEXT.projectFilterPlaceholder}
          />
          <SelectField
            className="w-full"
            options={TOOL_STATUS_FILTER_OPTIONS}
            value={filters.status}
            onChange={handleStatusFilterChange}
            placeholder={TOOLS_PAGE_TEXT.statusFilterPlaceholder}
          />
          <SelectField
            className="w-full"
            options={TOOL_TYPE_FILTER_OPTIONS}
            value={filters.type}
            onChange={handleTypeFilterChange}
            placeholder={TOOLS_PAGE_TEXT.typeFilterPlaceholder}
          />
        </div>
      </div>

      {toolsList.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={TOOLS_PAGE_TEXT.noToolsTitle}
          description={TOOLS_PAGE_TEXT.noToolsDescription}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolsList.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                canManageTools={canManageTools}
                onView={() => router.push(getToolDetailPath(tool.id))}
                onCheckout={() => setToolToCheckout(tool)}
                onReturn={() => setToolToReturn(tool)}
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
                options={TOOL_PAGE_SIZE_OPTIONS}
                value={String(filters.pageSize)}
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
                  disabled={
                    normalizedCurrentPage ===
                    TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE
                  }
                  onClick={() =>
                    updateToolQueryParams({
                      page: Math.max(
                        TOOLS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
                        normalizedCurrentPage - 1,
                      ),
                    })
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
                    updateToolQueryParams({
                      page: Math.min(totalPages, normalizedCurrentPage + 1),
                    })
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
      <ToolCheckoutDialog
        tool={toolToCheckout}
        isPending={isPending}
        onActionComplete={() => {
          setToolToCheckout(null);
          router.refresh();
        }}
        onOpenChange={(open) => {
          if (!open) setToolToCheckout(null);
        }}
        startTransition={startTransition}
      />
      <ToolReturnDialog
        tool={toolToReturn}
        isPending={isPending}
        onActionComplete={() => {
          setToolToReturn(null);
          router.refresh();
        }}
        onOpenChange={(open) => {
          if (!open) setToolToReturn(null);
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
  canManageTools: boolean;
  onView: () => void;
  onCheckout: () => void;
  onReturn: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * Displays a single tool as a project-style card.
 */
function ToolCard({
  tool,
  canManageTools,
  onView,
  onCheckout,
  onReturn,
  onEdit,
  onDelete,
}: ToolCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <ToolImage tool={tool} />
        <div className="flex items-center justify-between gap-2">
          <Badge variant={TOOL_STATUS_VARIANTS[tool.status]}>
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

      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onView}>
          <Eye data-icon="inline-start" />
          {TOOLS_CARD_TEXT.viewAction}
        </Button>
        {tool.status === 'AVAILABLE' ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCheckout}
          >
            <ClipboardCheck data-icon="inline-start" />
            {TOOLS_CARD_TEXT.checkoutAction}
          </Button>
        ) : null}
        {tool.status === 'CHECKEDOUT' ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onReturn}
          >
            <RotateCcw data-icon="inline-start" />
            {TOOLS_CARD_TEXT.checkinAction}
          </Button>
        ) : null}
        {canManageTools ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={onEdit}
            >
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
          </>
        ) : null}
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
        sizes={TOOLS_MANAGEMENT.IMAGE_SIZES.CARD}
        className="bg-muted"
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Wrench
          size={TOOLS_MANAGEMENT.LIMITS.IMAGE_PLACEHOLDER_SIZE}
          strokeWidth={1.5}
        />
        <span className="text-xs font-medium">
          {TOOL_DETAILS_TEXT.noImageLabel}
        </span>
      </div>
    </div>
  );
}

type ToolWorkflowDialogProps = {
  tool: ToolRow | null;
  isPending: boolean;
  onActionComplete: () => void;
  onOpenChange: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
};

function ToolCheckoutDialog({
  tool,
  isPending,
  onActionComplete,
  onOpenChange,
  startTransition,
}: ToolWorkflowDialogProps) {
  /**
   * Checks out the selected tool through the workflow RPC.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tool) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set(TOOLS_MANAGEMENT.FORM_KEYS.toolId, tool.id);

    startTransition(() => {
      void (async () => {
        const result = await checkoutToolAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.checkoutSuccess, 'success');
        onActionComplete();
      })();
    });
  }

  return (
    <Dialog open={Boolean(tool)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_CHECKOUT_TEXT.title}</DialogTitle>
          <DialogDescription>
            {TOOL_CHECKOUT_TEXT.description}
          </DialogDescription>
        </DialogHeader>
        {tool ? (
          <form
            key={tool.id}
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <ToolFormField
              label={TOOL_CHECKOUT_TEXT.conditionLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.checkoutCondition}
            >
              <SelectField
                id={TOOLS_MANAGEMENT.FORM_KEYS.checkoutCondition}
                name={TOOLS_MANAGEMENT.FORM_KEYS.checkoutCondition}
                options={TOOL_CHECKOUT_CONDITION_OPTIONS}
                defaultValue={TOOLS_MANAGEMENT.DEFAULTS.TOOL_CONDITION}
              />
            </ToolFormField>
            <ToolFormField
              label={TOOL_CHECKOUT_TEXT.workActivityLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.checkoutSessionName}
            >
              <Input
                id={TOOLS_MANAGEMENT.FORM_KEYS.checkoutSessionName}
                name={TOOLS_MANAGEMENT.FORM_KEYS.checkoutSessionName}
                placeholder={TOOL_CHECKOUT_TEXT.workActivityPlaceholder}
              />
            </ToolFormField>
            <ToolFormField
              label={TOOL_CHECKOUT_TEXT.notesLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.checkoutNotes}
            >
              <Textarea
                id={TOOLS_MANAGEMENT.FORM_KEYS.checkoutNotes}
                name={TOOLS_MANAGEMENT.FORM_KEYS.checkoutNotes}
                placeholder={TOOL_CHECKOUT_TEXT.notesPlaceholder}
              />
            </ToolFormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                {TOOL_CHECKOUT_TEXT.cancelButton}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {TOOL_CHECKOUT_TEXT.confirmButton}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ToolReturnDialog({
  tool,
  isPending,
  onActionComplete,
  onOpenChange,
  startTransition,
}: ToolWorkflowDialogProps) {
  const [evidenceFileName, setEvidenceFileName] = useState('');

  /**
   * Tracks the selected return evidence filename for display.
   */
  function handleEvidenceChange(event: ChangeEvent<HTMLInputElement>) {
    setEvidenceFileName(event.target.files?.[0]?.name ?? '');
  }

  /**
   * Clears local evidence selection state when the return dialog closes.
   */
  function handleOpenChange(open: boolean) {
    if (!open) {
      setEvidenceFileName('');
    }

    onOpenChange(open);
  }

  /**
   * Checks in the selected tool through the workflow RPC.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tool) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set(TOOLS_MANAGEMENT.FORM_KEYS.toolId, tool.id);

    startTransition(() => {
      void (async () => {
        const preparedFormData = await prepareReturnImageFormData(
          formData,
        ).catch(() => null);

        if (!preparedFormData) {
          showToast(TOOLS_ACTION_TEXT.imageInvalid, 'error');
          return;
        }

        const result = await returnToolAction(preparedFormData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.returnSuccess, 'success');
        setEvidenceFileName('');
        onActionComplete();
      })();
    });
  }

  return (
    <Dialog open={Boolean(tool)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_RETURN_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_RETURN_TEXT.description}</DialogDescription>
        </DialogHeader>
        {tool ? (
          <form
            key={tool.id}
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <ToolFormField
              label={TOOL_RETURN_TEXT.conditionLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.returnCondition}
            >
              <SelectField
                id={TOOLS_MANAGEMENT.FORM_KEYS.returnCondition}
                name={TOOLS_MANAGEMENT.FORM_KEYS.returnCondition}
                options={TOOL_CONDITION_OPTIONS}
                defaultValue={TOOLS_MANAGEMENT.DEFAULTS.TOOL_CONDITION}
              />
            </ToolFormField>
            <ToolFormField
              label={TOOL_RETURN_TEXT.evidenceImageLabel}
              htmlFor={RETURN_TOOL_IMAGE_INPUT_ID}
            >
              <div className="flex flex-col gap-2">
                <Input
                  id={RETURN_TOOL_IMAGE_INPUT_ID}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.returnImageFile}
                  type="file"
                  accept={TOOLS_MANAGEMENT.FILES.IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={handleEvidenceChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label
                      htmlFor={RETURN_TOOL_IMAGE_INPUT_ID}
                      className="cursor-pointer"
                    >
                      <Upload data-icon="inline-start" />
                      {TOOL_RETURN_TEXT.evidenceImageButton}
                    </label>
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {evidenceFileName || TOOL_RETURN_TEXT.noEvidenceSelected}
                  </span>
                </div>
              </div>
            </ToolFormField>
            <ToolFormField
              label={TOOL_RETURN_TEXT.notesLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.returnNotes}
            >
              <Textarea
                id={TOOLS_MANAGEMENT.FORM_KEYS.returnNotes}
                name={TOOLS_MANAGEMENT.FORM_KEYS.returnNotes}
                placeholder={TOOL_RETURN_TEXT.notesPlaceholder}
              />
            </ToolFormField>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                {TOOL_RETURN_TEXT.cancelButton}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {TOOL_RETURN_TEXT.confirmButton}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
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
  const [imageFileName, setImageFileName] = useState('');

  /**
   * Builds project options for the edit form assignment field.
   */
  const projectOptions = useMemo<SelectOption[]>(
    () => [
      {
        label: TOOLS_PAGE_TEXT.inventoryType,
        value: TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE,
      },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  /**
   * Tracks the selected replacement tool image filename for display.
   */
  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFileName(event.target.files?.[0]?.name ?? '');
  }

  /**
   * Clears local upload state when the edit dialog closes.
   */
  function handleOpenChange(open: boolean) {
    if (!open && isPending) {
      return;
    }

    if (!open) {
      setImageFileName('');
    }

    onOpenChange(open);
  }

  /**
   * Submits tool edits and mirrors the updated fields locally on success.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tool) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set(TOOLS_MANAGEMENT.FORM_KEYS.id, tool.id);

    startTransition(() => {
      void (async () => {
        const preparedFormData = await prepareToolImageFormData(formData).catch(
          () => null,
        );

        if (!preparedFormData) {
          showToast(TOOLS_ACTION_TEXT.imageInvalid, 'error');
          return;
        }

        const result = await updateToolAction(preparedFormData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        const nameValue = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.name);
        const statusValue = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.status);
        const conditionValue = formData.get(
          TOOLS_MANAGEMENT.FORM_KEYS.condition,
        );
        const projectIdValue = formData.get(
          TOOLS_MANAGEMENT.FORM_KEYS.projectId,
        );
        const notesValue = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.notes);
        const nextProjectId =
          projectIdValue === TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE ||
          typeof projectIdValue !== 'string'
            ? null
            : projectIdValue;
        const updatedTool: ToolRow = {
          ...tool,
          name: typeof nameValue === 'string' ? nameValue.trim() : tool.name,
          status:
            typeof statusValue === 'string'
              ? (statusValue as ToolStatus)
              : tool.status,
          condition:
            typeof conditionValue === 'string'
              ? (conditionValue as ToolCondition)
              : tool.condition,
          projectId: nextProjectId,
          projectName: getProjectName(nextProjectId),
          type: nextProjectId ? 'ASSIGNED' : 'INVENTORY',
          notes:
            typeof notesValue === 'string' && notesValue.trim().length > 0
              ? notesValue.trim()
              : null,
        };

        showToast(TOOLS_ACTION_TEXT.updateSuccess, 'success');
        setImageFileName('');
        onToolUpdated(updatedTool);
      })();
    });
  }

  return (
    <Dialog open={Boolean(tool)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_EDIT_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_EDIT_TEXT.description}</DialogDescription>
        </DialogHeader>

        {tool ? (
          <form
            key={tool.id}
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolFormField
                label={TOOL_EDIT_TEXT.nameLabel}
                htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.name}
              >
                <Input
                  id={TOOLS_MANAGEMENT.FORM_KEYS.name}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.name}
                  defaultValue={tool.name}
                  placeholder={TOOL_EDIT_TEXT.namePlaceholder}
                  required
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.projectLabel}
                htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
              >
                <SelectField
                  id={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
                  options={projectOptions}
                  defaultValue={
                    tool.projectId ??
                    TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE
                  }
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.statusLabel}
                htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.status}
              >
                <SelectField
                  id={TOOLS_MANAGEMENT.FORM_KEYS.status}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.status}
                  options={TOOL_STATUS_OPTIONS}
                  defaultValue={tool.status}
                />
              </ToolFormField>
              <ToolFormField
                label={TOOL_EDIT_TEXT.conditionLabel}
                htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.condition}
              >
                <SelectField
                  id={TOOLS_MANAGEMENT.FORM_KEYS.condition}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.condition}
                  options={TOOL_CONDITION_OPTIONS}
                  defaultValue={tool.condition}
                />
              </ToolFormField>
            </div>
            <ToolFormField
              label={TOOL_EDIT_TEXT.imageAttachmentLabel}
              htmlFor={EDIT_TOOL_IMAGE_INPUT_ID}
            >
              <div className="flex flex-col gap-2">
                <Input
                  id={EDIT_TOOL_IMAGE_INPUT_ID}
                  name={TOOLS_MANAGEMENT.FORM_KEYS.imageFile}
                  type="file"
                  accept={TOOLS_MANAGEMENT.FILES.IMAGE_ACCEPT}
                  className="sr-only"
                  onChange={handleImageChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label
                      htmlFor={EDIT_TOOL_IMAGE_INPUT_ID}
                      className="cursor-pointer"
                    >
                      <Upload data-icon="inline-start" />
                      {TOOL_EDIT_TEXT.imageAttachmentButton}
                    </label>
                  </Button>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {imageFileName || TOOL_EDIT_TEXT.noImageSelected}
                  </span>
                </div>
              </div>
            </ToolFormField>
            <ToolFormField
              label={TOOL_EDIT_TEXT.notesLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.notes}
            >
              <Textarea
                id={TOOLS_MANAGEMENT.FORM_KEYS.notes}
                name={TOOLS_MANAGEMENT.FORM_KEYS.notes}
                defaultValue={tool.notes ?? ''}
                placeholder={TOOL_EDIT_TEXT.notesPlaceholder}
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
              <Button type="submit" isLoading={isPending}>
                {TOOL_EDIT_TEXT.saveButton}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compresses the optional tool image before submitting the server action.
 */
async function prepareToolImageFormData(formData: FormData): Promise<FormData> {
  const imageFile = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.imageFile);

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return formData;
  }

  const compressedImage = await compressToolCatalogImage(imageFile);
  formData.set(TOOLS_MANAGEMENT.FORM_KEYS.imageFile, compressedImage);

  return formData;
}

/**
 * Compresses the optional return evidence image before submitting the server action.
 */
async function prepareReturnImageFormData(
  formData: FormData,
): Promise<FormData> {
  const imageFile = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.returnImageFile);

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return formData;
  }

  const compressedImage = await compressToolEvidenceImage(imageFile);
  formData.set(TOOLS_MANAGEMENT.FORM_KEYS.returnImageFile, compressedImage);

  return formData;
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
  const isCheckedOut = tool?.status === 'CHECKEDOUT';

  /**
   * Deletes the selected tool and updates local state on success.
   */
  function handleDelete() {
    if (!tool || isCheckedOut) {
      return;
    }

    const formData = new FormData();
    formData.set(TOOLS_MANAGEMENT.FORM_KEYS.id, tool.id);

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
          <DialogTitle>
            {isCheckedOut
              ? TOOL_DELETE_TEXT.checkedOutTitle
              : TOOL_DELETE_TEXT.title}
          </DialogTitle>
          <DialogDescription>
            {isCheckedOut
              ? TOOL_DELETE_TEXT.checkedOutDescription
              : TOOL_DELETE_TEXT.description}
          </DialogDescription>
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
          {!isCheckedOut && (
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 data-icon="inline-start" />
              {TOOL_DELETE_TEXT.confirmButton}
            </Button>
          )}
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
