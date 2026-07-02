'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { ProjectCard } from '@/components/projects/project-card';
import {
  ProjectFormDialog,
  type ProjectDialogMode,
} from '@/components/projects/project-form-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectField } from '@/components/ui/select-field';
import {
  PROJECT_PAGE_SIZE_OPTIONS,
  PROJECT_FILTER_OPTIONS,
  PROJECTS_MANAGEMENT,
} from '@/constants/components/projects/projects-constants';
import {
  PROJECTS_ACTION_TEXT,
  PROJECTS_LIST_TEXT,
  PROJECTS_PAGINATION_TEXT,
  PROJECTS_PAGE_TEXT,
} from '@/locales/app/(dashboard)/projects/projects-page-locales';
import {
  hasProjectBudget,
  type ProjectClientRow,
  type ProjectListFilters,
  type ProjectManagerRow,
} from '@/lib/dal/projects';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

type ProjectsListProps = {
  canManageProjects: boolean;
  filters: ProjectListFilters;
  projects: ProjectClientRow[];
  totalPages: number;
};

/**
 * Optimistic project rows tied to the server snapshot they extend.
 */
type ProjectOptimisticState = {
  rows: ProjectClientRow[];
  serverProjects: ProjectClientRow[];
};

/**
 * Renders the projects workspace.
 *
 * Managers can create and edit projects; crew can only view them.
 */
export function ProjectsList({
  canManageProjects,
  filters,
  projects,
  totalPages,
}: ProjectsListProps) {
  const router = useRouter();
  const [optimisticState, setOptimisticState] =
    useState<ProjectOptimisticState>({
      rows: projects,
      serverProjects: projects,
    });
  const [dialogMode, setDialogMode] = useState<ProjectDialogMode>('create');
  const [projectToEdit, setProjectToEdit] = useState<ProjectManagerRow | null>(
    null,
  );
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const projectRows =
    optimisticState.serverProjects === projects
      ? optimisticState.rows
      : projects;
  const normalizedCurrentPage = Math.min(filters.page, totalPages);
  const pageSummary = PROJECTS_PAGINATION_TEXT.summary
    .replace(
      PROJECTS_MANAGEMENT.PAGE_SUMMARY_TOKENS.CURRENT_PAGE,
      String(normalizedCurrentPage),
    )
    .replace(
      PROJECTS_MANAGEMENT.PAGE_SUMMARY_TOKENS.TOTAL_PAGES,
      String(totalPages),
    );

  /**
   * Updates URL search params so the server returns the matching projects page.
   */
  const updateProjectQueryParams = useCallback(
    (
      nextParams: Partial<ProjectListFilters>,
      navigation: 'push' | 'replace' = 'push',
    ) => {
      const params = new URLSearchParams();
      const mergedFilters = {
        ...filters,
        ...nextParams,
      };

      if (mergedFilters.search) {
        params.set(
          PROJECTS_MANAGEMENT.QUERY_PARAMS.search,
          mergedFilters.search,
        );
      }

      if (mergedFilters.status !== PROJECTS_MANAGEMENT.FILTERS.ALL) {
        params.set(
          PROJECTS_MANAGEMENT.QUERY_PARAMS.status,
          mergedFilters.status,
        );
      }

      if (mergedFilters.page !== PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
        params.set(
          PROJECTS_MANAGEMENT.QUERY_PARAMS.page,
          String(mergedFilters.page),
        );
      }

      if (mergedFilters.pageSize !== PROJECTS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
        params.set(
          PROJECTS_MANAGEMENT.QUERY_PARAMS.pageSize,
          String(mergedFilters.pageSize),
        );
      }

      const queryString = params.toString();
      const path = queryString
        ? `${PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH}?${queryString}`
        : PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH;

      router[navigation](path);
    },
    [filters, router],
  );

  // Keep typing local and update the URL only after the debounce delay.
  const { inputValue: searchInput, setInputValue: setSearchInput } =
    useDebouncedSearch({
      serverValue: filters.search,
      debounceMs: PROJECTS_MANAGEMENT.SEARCH_DEBOUNCE_MS,
      onDebouncedChange: (value) => {
        updateProjectQueryParams(
          {
            page: PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
            search: value,
          },
          'replace',
        );
      },
    });

  function projectMatchesActiveFilters(project: ProjectClientRow) {
    const matchesSearch =
      !filters.search ||
      project.project_name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus =
      filters.status === PROJECTS_MANAGEMENT.FILTERS.ALL ||
      project.status === filters.status;

    return matchesSearch && matchesStatus;
  }

  function handleStatusFilterChange(value: string) {
    updateProjectQueryParams({
      page: PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      status: value,
    });
  }

  function handlePageSizeChange(value: string) {
    updateProjectQueryParams({
      page: PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      pageSize: Number(value),
    });
  }

  function openCreateDialog() {
    setDialogMode('create');
    setProjectToEdit(null);
    setIsProjectDialogOpen(true);
  }

  function openEditDialog(project: ProjectClientRow) {
    if (!canManageProjects || !hasProjectBudget(project)) return;

    setDialogMode('edit');
    setProjectToEdit(project);
    setIsProjectDialogOpen(true);
  }

  function handleProjectCreated(project: ProjectManagerRow) {
    // Show the created project immediately, then refresh server data.
    const shouldShowCreatedProject = projectMatchesActiveFilters(project);

    setOptimisticState((currentState) => ({
      rows: shouldShowCreatedProject
        ? [
            project,
            ...(currentState.serverProjects === projects
              ? currentState.rows
              : projects),
          ].slice(0, filters.pageSize)
        : currentState.serverProjects === projects
          ? currentState.rows
          : projects,
      serverProjects: projects,
    }));
    router.refresh();
  }

  function handleProjectUpdated(updatedProject: ProjectManagerRow) {
    // Replace the edited row immediately, then refresh server data.
    const shouldKeepUpdatedProject =
      projectMatchesActiveFilters(updatedProject);

    setOptimisticState((currentState) => ({
      rows: (currentState.serverProjects === projects
        ? currentState.rows
        : projects
      )
        .map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        )
        .filter(
          (project) =>
            project.id !== updatedProject.id || shouldKeepUpdatedProject,
        ),
      serverProjects: projects,
    }));
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
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

        <div>
          <SearchFilter
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder={PROJECTS_LIST_TEXT.searchPlaceholder}
            filterOptions={PROJECT_FILTER_OPTIONS}
            filterValue={filters.status}
            onFilterChange={handleStatusFilterChange}
            filterPlaceholder={PROJECTS_LIST_TEXT.filterPlaceholder}
          />
        </div>

        {projectRows.length === 0 ? (
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectRows.map((project) => (
                <ProjectCard
                  key={project.id}
                  canManageProjects={canManageProjects}
                  project={project}
                  onView={() => router.push(`/projects/${project.id}`)}
                  onEdit={() => openEditDialog(project)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {PROJECTS_PAGINATION_TEXT.pageSizeLabel}
                </span>
                <SelectField
                  options={PROJECT_PAGE_SIZE_OPTIONS}
                  value={String(filters.pageSize)}
                  onChange={handlePageSizeChange}
                  placeholder={PROJECTS_PAGINATION_TEXT.pageSizeLabel}
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
                      PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE
                    }
                    onClick={() =>
                      updateProjectQueryParams({
                        page: Math.max(
                          PROJECTS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
                          normalizedCurrentPage - 1,
                        ),
                      })
                    }
                  >
                    <ChevronLeft data-icon="inline-start" />
                    {PROJECTS_PAGINATION_TEXT.previousButton}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={normalizedCurrentPage === totalPages}
                    onClick={() =>
                      updateProjectQueryParams({
                        page: Math.min(totalPages, normalizedCurrentPage + 1),
                      })
                    }
                  >
                    {PROJECTS_PAGINATION_TEXT.nextButton}
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            </div>
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

      {canManageProjects && (
        <ProjectFormDialog
          mode={dialogMode}
          onClose={() => setIsProjectDialogOpen(false)}
          onProjectCreated={handleProjectCreated}
          onProjectUpdated={handleProjectUpdated}
          open={isProjectDialogOpen}
          project={projectToEdit}
        />
      )}
    </div>
  );
}
