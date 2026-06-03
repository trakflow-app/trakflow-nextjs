import Link from 'next/link';
import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, FolderOpen, Tag, Wrench } from 'lucide-react';
import AppImage from '@/components/ui/app-image';
import { Badge } from '@/components/ui/badge';
import { requireOrgMember } from '@/lib/dal/auth';
import { getToolById } from '@/lib/dal/tools';
import {
  TOOL_CONDITION_LABELS,
  TOOL_DETAILS_TEXT,
  TOOLS_CARD_TEXT,
  TOOLS_PAGE_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';
import { TOOL_STATUS_VARIANTS } from '@/constants/components/tools/tools-constants';

type ToolDetailPageProps = {
  params: Promise<{ id: string }>;
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
 * Tool detail page with overview, assignment, condition, image, and notes.
 */
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { id } = await params;
  const { account } = await requireOrgMember();
  const tool = await getToolById(id, account.org_id as string);

  if (!tool) notFound();

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <Link
            href="/tools"
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

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {TOOL_DETAILS_TEXT.imageLabel}
          </h2>
          {tool.imagePath ? (
            <AppImage
              src={tool.imagePath}
              alt={tool.name}
              aspectRatio="video"
              rounded="md"
              className="bg-muted"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Wrench className="h-12 w-12" strokeWidth={1.5} />
                <span className="text-sm font-medium">
                  {TOOL_DETAILS_TEXT.noImageLabel}
                </span>
              </div>
            </div>
          )}
        </section>

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
