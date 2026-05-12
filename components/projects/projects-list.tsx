'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  Eye,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchFilter } from '@/components/ui/search-filter';
import { type SelectOption } from '@/components/ui/select-field';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import type { ProjectRow } from '@/lib/dal/projects';
import type { Database } from '@/lib/types/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = Database['public']['Enums']['project_status'];
type FilterValue = 'all' | ProjectStatus;

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_ALL = 'all';

const NEW_PROJECT_BUTTON = 'New Project';
const SEARCH_PLACEHOLDER = 'Search projects...';
const FILTER_PLACEHOLDER = 'Filter by status';
const VIEW_BUTTON = 'View';
const EDIT_BUTTON = 'Edit';
const DELETE_BUTTON = 'Delete';
const BUDGET_LABEL = 'Budget:';
const EMPTY_TITLE = 'No projects found';
const EMPTY_DESCRIPTION =
  'No projects match your current filters. Try adjusting your search or create a new project.';
const EMPTY_ACTION = 'Create Project';
const NO_BUDGET = 'No budget set';
const NO_END_DATE = 'Ongoing';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

const FILTER_OPTIONS: SelectOption[] = [
  { label: 'All', value: FILTER_ALL },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

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

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectRow;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Card displaying a single project's key info and action buttons.
 */
function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-muted p-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ProjectStatusBadge
            status={project.status}
            label={STATUS_LABELS[project.status]}
          />
        </div>
        <CardTitle className="text-base">{project.project_name}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {formatDate(project.start_date)} –{' '}
            {project.end_date ? formatDate(project.end_date) : NO_END_DATE}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>
            {BUDGET_LABEL}{' '}
            <span className="font-semibold text-foreground">
              {project.budget_amount
                ? formatBudget(project.budget_amount)
                : NO_BUDGET}
            </span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onView}>
          <Eye />
          {VIEW_BUTTON}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={onEdit}>
          <Edit2 />
          {EDIT_BUTTON}
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={onDelete}
        >
          <Trash2 />
          {DELETE_BUTTON}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── ProjectsList ─────────────────────────────────────────────────────────────

interface ProjectsListProps {
  projects: ProjectRow[];
}

/**
 * Client component — owns search, filter, and card navigation for the projects list.
 * Receives real project data from the parent Server Component page.
 */
export function ProjectsList({ projects }: ProjectsListProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(FILTER_ALL);

  const filtered = projects.filter((project) => {
    const matchesSearch = project.project_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === FILTER_ALL || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Search + filter */}
      <div className="mb-6">
        <SearchFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={SEARCH_PLACEHOLDER}
          filterOptions={FILTER_OPTIONS}
          filterValue={statusFilter}
          onFilterChange={(value: string) =>
            setStatusFilter(value as FilterValue)
          }
          filterPlaceholder={FILTER_PLACEHOLDER}
        />
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={EMPTY_TITLE}
          description={EMPTY_DESCRIPTION}
          actionText={EMPTY_ACTION}
          onActionClick={() => {
            // TODO: open create project modal
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={() => router.push(`/projects/${project.id}`)}
              onEdit={() => {
                // TODO: open edit modal
              }}
              onDelete={() => {
                // TODO: open delete confirmation
              }}
            />
          ))}
        </div>
      )}

      {/* New project button — floated to top in the page header */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="sm">
          <Plus />
          {NEW_PROJECT_BUTTON}
        </Button>
      </div>
    </div>
  );
}
