import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectCrewRow } from '@/lib/dal/projects';
import {
  DASHBOARD_PROGRESS_BAR_HEIGHT_CLASS_NAME,
  DASHBOARD_ROLE_BADGE_VARIANTS,
  EMPTY_PROJECT_PROGRESS_PERCENT,
  MAX_PROGRESS_PERCENT,
  MILLISECONDS_PER_DAY,
  MIN_PROGRESS_PERCENT,
  PROJECT_PROGRESS_FALLBACKS,
  PROJECT_RISK_WINDOW_DAYS,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

type RecentProjectsCardProps = {
  projects: ProjectCrewRow[];
};

type ProjectDisplayStatus = keyof typeof DASHBOARD_TEXT.projectStatuses;

const PROJECT_STATUS_BADGE_VARIANTS = {
  onTrack: DASHBOARD_ROLE_BADGE_VARIANTS.CREW,
  atRisk: DASHBOARD_ROLE_BADGE_VARIANTS.OWNER,
  delayed: 'destructive',
  completed: DASHBOARD_ROLE_BADGE_VARIANTS.FOREMAN,
} as const;

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Formats project dates for dashboard display.
 */
function formatProjectDate(value: string | null): string {
  if (!value) {
    return DASHBOARD_TEXT.noProjectEndDateLabel;
  }

  return DATE_FORMATTER.format(new Date(value));
}

/**
 * Derives a temporary progress value until the database stores project progress.
 */
function getProjectProgressPercent(
  project: ProjectCrewRow,
  index: number,
): number {
  if (project.status === 'COMPLETED') {
    return MAX_PROGRESS_PERCENT;
  }

  const fallbackIndex = index % PROJECT_PROGRESS_FALLBACKS.length;
  return (
    PROJECT_PROGRESS_FALLBACKS[fallbackIndex] ?? EMPTY_PROJECT_PROGRESS_PERCENT
  );
}

/**
 * Derives a display status from project status and end date.
 */
function getProjectDisplayStatus(project: ProjectCrewRow): ProjectDisplayStatus {
  if (project.status === 'COMPLETED') {
    return 'completed';
  }

  if (!project.end_date) {
    return 'onTrack';
  }

  const now = new Date();
  const endDate = new Date(project.end_date);
  const daysUntilDue =
    (endDate.getTime() - now.getTime()) / MILLISECONDS_PER_DAY;

  if (daysUntilDue < MIN_PROGRESS_PERCENT) {
    return 'delayed';
  }

  if (daysUntilDue <= PROJECT_RISK_WINDOW_DAYS) {
    return 'atRisk';
  }

  return 'onTrack';
}

/**
 * Shows recent organization projects with status and progress summaries.
 */
export function RecentProjectsCard({ projects }: RecentProjectsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {DASHBOARD_TEXT.recentProjectsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length ? (
          <div className="flex flex-col gap-5">
            {projects.map((project, index) => {
              const progressPercent = getProjectProgressPercent(project, index);
              const displayStatus = getProjectDisplayStatus(project);

              return (
                <article key={project.id} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">
                        {project.project_name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {DASHBOARD_TEXT.projectManagerLabel}{' '}
                        {DASHBOARD_TEXT.unassignedManagerLabel}
                      </p>
                    </div>
                    <Badge
                      variant={PROJECT_STATUS_BADGE_VARIANTS[displayStatus]}
                    >
                      {DASHBOARD_TEXT.projectStatuses[displayStatus]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-1">
                      <CalendarDays aria-hidden="true" className="size-3" />
                      <span className="truncate">
                        {formatProjectDate(project.end_date)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      {progressPercent}%
                    </span>
                  </div>

                  <div
                    className={`w-full rounded-full bg-muted ${DASHBOARD_PROGRESS_BAR_HEIGHT_CLASS_NAME}`}
                  >
                    <div
                      className={`rounded-full bg-primary ${DASHBOARD_PROGRESS_BAR_HEIGHT_CLASS_NAME}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">
              {DASHBOARD_TEXT.emptyProjectsTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {DASHBOARD_TEXT.emptyProjectsDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
