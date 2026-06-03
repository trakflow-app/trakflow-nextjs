import type { Database } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];

// ─── Style maps ───────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-success/10 text-success',
  COMPLETED: 'bg-muted text-muted-foreground',
};

const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-success',
  COMPLETED: 'bg-muted-foreground',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  label: string;
}

/**
 * Pill badge for a project's status. Accepts a label so the caller controls
 * the display string — keeps this component locale-agnostic.
 */
export function ProjectStatusBadge({ status, label }: ProjectStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[status]}`}
      />
      {label}
    </span>
  );
}
