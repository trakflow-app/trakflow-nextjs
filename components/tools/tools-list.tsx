'use client';

import { useMemo, useState } from 'react';
import { Eye, FolderOpen, Wrench } from 'lucide-react';
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
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import type { ToolAssignmentType, ToolRow, ToolStatus } from '@/lib/dal/tools';
import {
  TOOL_CONDITION_LABELS,
  TOOL_DETAILS_TEXT,
  TOOLS_CARD_TEXT,
  TOOLS_PAGE_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type FilterValue = 'all' | ToolStatus;
type TypeFilterValue = 'all' | ToolAssignmentType;

type ToolsListProps = {
  tools: ToolRow[];
};

const FILTER_ALL = 'all';
const IMAGE_PLACEHOLDER_SIZE = 48;

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
 * Client-side tools card grid with search, filters, and a view-only details dialog.
 */
export function ToolsList({ tools }: ToolsListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>(FILTER_ALL);
  const [selectedTool, setSelectedTool] = useState<ToolRow | null>(null);

  const filteredTools = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesSearch =
        !normalizedSearch || tool.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === FILTER_ALL || tool.status === statusFilter;
      const matchesType = typeFilter === FILTER_ALL || tool.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, tools, typeFilter]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <SearchFilter
          className="flex-1"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={TOOLS_PAGE_TEXT.searchPlaceholder}
          filterOptions={STATUS_FILTER_OPTIONS}
          filterValue={statusFilter}
          onFilterChange={(value) => setStatusFilter(value as FilterValue)}
          filterPlaceholder={TOOLS_PAGE_TEXT.statusFilterPlaceholder}
        />
        <div className="lg:w-56">
          <SelectField
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as TypeFilterValue)}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onView={() => setSelectedTool(tool)}
            />
          ))}
        </div>
      )}

      <ToolDetailsDialog
        tool={selectedTool}
        onOpenChange={(open) => {
          if (!open) setSelectedTool(null);
        }}
      />
    </div>
  );
}

type ToolCardProps = {
  tool: ToolRow;
  onView: () => void;
};

/**
 * Displays a single tool as a project-style card.
 */
function ToolCard({ tool, onView }: ToolCardProps) {
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

      <CardFooter className="border-t pt-4">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onView}>
          <Eye />
          {TOOLS_CARD_TEXT.viewAction}
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
  onOpenChange: (open: boolean) => void;
};

function ToolDetailsDialog({ tool, onOpenChange }: ToolDetailsDialogProps) {
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
