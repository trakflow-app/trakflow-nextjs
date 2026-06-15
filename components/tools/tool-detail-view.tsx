import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, FolderOpen, Tag, Wrench } from 'lucide-react';
import AppImage from '@/components/ui/app-image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TOOLS_MANAGEMENT,
  TOOL_STATUS_VARIANTS,
} from '@/constants/components/tools/tools-constants';
import type { ToolRow } from '@/lib/dal/tools';
import {
  TOOL_CONDITION_LABELS,
  TOOL_DETAILS_TEXT,
  TOOLS_CARD_TEXT,
  TOOLS_PAGE_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolDetailViewProps = {
  imageSection: ReactNode;
  tool: ToolRow;
};

type ToolDetailImageSectionProps = {
  imagePath: string | null;
  toolName: string;
};

type ToolMetaItemProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

function ToolMetaItem({ icon: Icon, label, value }: ToolMetaItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        {label}: <span className="font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}

/**
 * Renders the tool detail page body.
 */
export function ToolDetailView({ imageSection, tool }: ToolDetailViewProps) {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href={TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {TOOL_DETAILS_TEXT.backButton}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
              <Badge variant={TOOL_STATUS_VARIANTS[tool.status]}>
                {TOOL_STATUS_LABELS[tool.status]}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <ToolMetaItem
              icon={Tag}
              label={TOOL_DETAILS_TEXT.tagLabel}
              value={`${TOOLS_CARD_TEXT.tagPrefix} ${tool.tagNumber}`}
            />
            <ToolMetaItem
              icon={FolderOpen}
              label={TOOL_DETAILS_TEXT.projectLabel}
              value={tool.projectName}
            />
            <ToolMetaItem
              icon={Wrench}
              label={TOOL_DETAILS_TEXT.conditionLabel}
              value={TOOL_CONDITION_LABELS[tool.condition]}
            />
            <ToolMetaItem
              icon={Tag}
              label={TOOL_DETAILS_TEXT.typeLabel}
              value={
                tool.type === 'ASSIGNED'
                  ? TOOLS_PAGE_TEXT.assignedType
                  : TOOLS_PAGE_TEXT.inventoryType
              }
            />
          </div>
        </div>

        {imageSection}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {TOOL_DETAILS_TEXT.notesLabel}
          </h2>
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            {tool.notes || TOOL_DETAILS_TEXT.noNotes}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Renders the tool image section once the private image URL is available.
 */
export function ToolDetailImageSection({
  imagePath,
  toolName,
}: ToolDetailImageSectionProps) {
  return (
    <section className="max-w-3xl space-y-3">
      <h2 className="text-lg font-semibold">{TOOL_DETAILS_TEXT.imageLabel}</h2>
      {imagePath ? (
        <AppImage
          src={imagePath}
          alt={toolName}
          aspectRatio="video"
          rounded="md"
          sizes={TOOLS_MANAGEMENT.IMAGE_SIZES.DETAIL}
          loading="eager"
          className="bg-muted"
        />
      ) : (
        <ToolDetailImagePlaceholder />
      )}
    </section>
  );
}

/**
 * Renders the tool image placeholder used when no catalog image exists.
 */
export function ToolDetailImagePlaceholder() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Wrench className="h-12 w-12" strokeWidth={1.5} />
        <span className="text-sm font-medium">
          {TOOL_DETAILS_TEXT.noImageLabel}
        </span>
      </div>
    </div>
  );
}

/**
 * Placeholder while private image signing resolves.
 */
export function ToolDetailImageSkeleton() {
  return (
    <section className="max-w-3xl space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="aspect-video w-full rounded-lg" />
    </section>
  );
}
