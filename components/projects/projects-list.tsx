'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus } from 'lucide-react';
import { ProjectCard } from '@/components/projects/project-card';
import {
  ProjectFormDialog,
  type ProjectDialogMode,
} from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchFilter } from '@/components/ui/search-filter';
import {
  PROJECT_FILTER_OPTIONS,
  PROJECTS_MANAGEMENT,
} from '@/constants/components/projects/projects-constants';
import {
  PROJECTS_ACTION_TEXT,
  PROJECTS_LIST_TEXT,
  PROJECTS_PAGE_TEXT,
} from '@/locales/app/(dashboard)/projects/projects-page-locales';
import type { ProjectRow } from '@/lib/dal/projects';
import type { Database } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type FilterValue = 'all' | ProjectStatus;

type ProjectsListProps = {
  canManageProjects: boolean;
  projects: ProjectRow[];
};

/**
 * Optimistic project rows tied to the server snapshot they extend.
 */
type ProjectOptimisticState = {
  rows: ProjectRow[];
  serverProjects: ProjectRow[];
};

/**
 * Renders the projects workspace.
 *
 * Managers can create and edit projects; crew can only view them.
 */
export function ProjectsList({
  canManageProjects,
  projects,
}: ProjectsListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(
    PROJECTS_MANAGEMENT.FILTERS.ALL,
  );
  const [optimisticState, setOptimisticState] =
    useState<ProjectOptimisticState>({
      rows: projects,
      serverProjects: projects,
    });
  const [dialogMode, setDialogMode] = useState<ProjectDialogMode>('create');
  const [projectToEdit, setProjectToEdit] = useState<ProjectRow | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const projectRows =
    optimisticState.serverProjects === projects
      ? optimisticState.rows
      : projects;

  // The page loads all current projects, so search/status filtering is local.
  const filteredProjects = useMemo(
    () =>
      projectRows.filter((project) => {
        const matchesSearch = project.project_name
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === PROJECTS_MANAGEMENT.FILTERS.ALL ||
          project.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [projectRows, search, statusFilter],
  );

  function openCreateDialog() {
    setDialogMode('create');
    setProjectToEdit(null);
    setIsProjectDialogOpen(true);
  }

  function openEditDialog(project: ProjectRow) {
    setDialogMode('edit');
    setProjectToEdit(project);
    setIsProjectDialogOpen(true);
  }

  function handleProjectCreated(project: ProjectRow) {
    // Show the created project immediately, then refresh server data.
    setOptimisticState((currentState) => ({
      rows: [
        project,
        ...(currentState.serverProjects === projects
          ? currentState.rows
          : projects),
      ],
      serverProjects: projects,
    }));
    router.refresh();
  }

  function handleProjectUpdated(updatedProject: ProjectRow) {
    // Replace the edited row immediately, then refresh server data.
    setOptimisticState((currentState) => ({
      rows: (currentState.serverProjects === projects
        ? currentState.rows
        : projects
      ).map((project) =>
        project.id === updatedProject.id ? updatedProject : project,
      ),
      serverProjects: projects,
    }));
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {PROJECTS_PAGE_TEXT.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {PROJECTS_PAGE_TEXT.description}
            </p>
            {!canManageProjects && (
              <p className="mt-2 text-xs text-muted-foreground">
                {PROJECTS_ACTION_TEXT.managementOnly}
              </p>
            )}
          </div>
          {canManageProjects && (
            <Button onClick={openCreateDialog}>
              <Plus />
              {PROJECTS_ACTION_TEXT.newProjectButton}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <SearchFilter
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={PROJECTS_LIST_TEXT.searchPlaceholder}
            filterOptions={PROJECT_FILTER_OPTIONS}
            filterValue={statusFilter}
            onFilterChange={(value: string) =>
              setStatusFilter(value as FilterValue)
            }
            filterPlaceholder={PROJECTS_LIST_TEXT.filterPlaceholder}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={PROJECTS_LIST_TEXT.emptyTitle}
            description={PROJECTS_LIST_TEXT.emptyDescription}
            actionText={
              canManageProjects ? PROJECTS_LIST_TEXT.emptyAction : undefined
            }
            onActionClick={canManageProjects ? openCreateDialog : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                canManageProjects={canManageProjects}
                project={project}
                onView={() => router.push(`/projects/${project.id}`)}
                onEdit={() => openEditDialog(project)}
              />
            ))}
          </div>
        )}

        {canManageProjects && (
          <div className="fixed bottom-6 right-6 md:hidden">
            <Button size="sm" onClick={openCreateDialog}>
              <Plus />
              {PROJECTS_ACTION_TEXT.newProjectButton}
            </Button>
          </div>
        )}
      </div>

      <ProjectFormDialog
        mode={dialogMode}
        onClose={() => setIsProjectDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
        onProjectUpdated={handleProjectUpdated}
        open={isProjectDialogOpen}
        project={projectToEdit}
      />
    </div>
  );
}
