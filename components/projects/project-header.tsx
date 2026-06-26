'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Pencil } from 'lucide-react';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';
import {
  hasProjectBudget,
  type ProjectClientRow,
  type ProjectManagerRow,
} from '@/lib/dal/projects';

const { header } = PROJECT_DETAIL_MESSAGES;

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

interface ProjectHeaderProps {
  canManageProjects: boolean;
  project: ProjectClientRow;
}

/**
 * Detail page header with role-aware project actions.
 */
export function ProjectHeader({
  canManageProjects,
  project,
}: ProjectHeaderProps) {
  const router = useRouter();
  const [currentProject, setCurrentProject] = useState(project);
  const managerProject = hasProjectBudget(currentProject)
    ? currentProject
    : null;
  const canViewBudget = canManageProjects && managerProject;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  function handleProjectUpdated(updatedProject: ProjectManagerRow) {
    // Update the visible header immediately, then refresh server-rendered sections.
    setCurrentProject(updatedProject);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {header.backButton}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {currentProject.project_name}
            </h1>
            <ProjectStatusBadge
              status={currentProject.status}
              label={header.statusLabels[currentProject.status]}
            />
          </div>

          {canManageProjects && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="h-4 w-4" />
              {header.editButton}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {header.startDateLabel}:{' '}
              <span className="font-medium text-foreground">
                {formatDate(currentProject.start_date)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {header.endDateLabel}:{' '}
              <span className="font-medium text-foreground">
                {currentProject.end_date
                  ? formatDate(currentProject.end_date)
                  : header.noEndDate}
              </span>
            </span>
          </div>

          {canViewBudget && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>
                {header.budgetLabel}:{' '}
                <span className="font-medium text-foreground">
                  {managerProject.budget_amount
                    ? formatBudget(managerProject.budget_amount)
                    : header.noBudget}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {canManageProjects && managerProject && (
        <ProjectFormDialog
          mode="edit"
          onClose={() => setIsEditDialogOpen(false)}
          onProjectCreated={() => undefined}
          onProjectUpdated={handleProjectUpdated}
          open={isEditDialogOpen}
          project={managerProject}
        />
      )}
    </>
  );
}
