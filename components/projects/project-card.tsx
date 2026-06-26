'use client';

import { Building2, Calendar, DollarSign, Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { PROJECT_STATUS_LABELS } from '@/constants/components/projects/projects-constants';
import { PROJECTS_ACTION_TEXT } from '@/locales/app/(dashboard)/projects/projects-page-locales';
import {
  hasProjectBudget,
  type ProjectClientRow,
} from '@/lib/dal/projects';

type ProjectCardProps = {
  canManageProjects: boolean;
  onEdit: () => void;
  onView: () => void;
  project: ProjectClientRow;
};

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

/**
 * Renders a project summary card with role-aware actions.
 */
export function ProjectCard({
  canManageProjects,
  onEdit,
  onView,
  project,
}: ProjectCardProps) {
  const canViewBudget = canManageProjects && hasProjectBudget(project);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-muted p-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ProjectStatusBadge
            status={project.status}
            label={PROJECT_STATUS_LABELS[project.status]}
          />
        </div>
        <CardTitle className="text-base">{project.project_name}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {formatDate(project.start_date)} -{' '}
            {project.end_date
              ? formatDate(project.end_date)
              : PROJECTS_ACTION_TEXT.noEndDate}
          </span>
        </div>

        {canViewBudget && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>
              {PROJECTS_ACTION_TEXT.budgetLabel}{' '}
              <span className="font-semibold text-foreground">
                {project.budget_amount
                  ? formatBudget(project.budget_amount)
                  : PROJECTS_ACTION_TEXT.noBudget}
              </span>
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onView}>
          <Eye />
          {PROJECTS_ACTION_TEXT.viewButton}
        </Button>
        {canManageProjects && (
          <Button variant="ghost" size="sm" className="flex-1" onClick={onEdit}>
            <Edit2 />
            {PROJECTS_ACTION_TEXT.editButton}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
