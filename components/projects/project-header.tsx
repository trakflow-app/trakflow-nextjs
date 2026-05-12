import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';
import type { ProjectRow } from '@/lib/dal/projects';

const { header } = PROJECT_DETAIL_MESSAGES;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectHeaderProps {
  project: ProjectRow;
}

/**
 * Detail page header — project name, status, timeline, budget, and edit stub.
 */
export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {header.backButton}
      </Link>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {project.project_name}
          </h1>
          <ProjectStatusBadge
            status={project.status}
            label={header.statusLabels[project.status]}
          />
        </div>

        {/* Edit stub — implementation is out of scope for this ticket */}
        <Button variant="outline" disabled>
          <Pencil className="h-4 w-4" />
          {header.editButton}
        </Button>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {header.startDateLabel}:{' '}
            <span className="font-medium text-foreground">
              {formatDate(project.start_date)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {header.endDateLabel}:{' '}
            <span className="font-medium text-foreground">
              {project.end_date
                ? formatDate(project.end_date)
                : header.noEndDate}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>
            {header.budgetLabel}:{' '}
            <span className="font-medium text-foreground">
              {project.budget_amount
                ? formatBudget(project.budget_amount)
                : header.noBudget}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
