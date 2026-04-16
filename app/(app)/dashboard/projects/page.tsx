'use client';

import { useState } from 'react';
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
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchFilter } from '@/components/ui/search-filter';
import { type SelectOption } from '@/components/ui/select-field';

// ─── String constants ────────────────────────────────────────────────────────

const PAGE_TITLE = 'Projects';
const PAGE_DESCRIPTION = 'Manage your construction projects';
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

// ─── Status constants ─────────────────────────────────────────────────────────

const STATUS_ALL = 'all';
const STATUS_ACTIVE = 'active';
const STATUS_COMPLETED = 'completed';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = 'active' | 'completed';
type FilterValue = 'all' | ProjectStatus;

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Downtown Office Complex',
    status: STATUS_ACTIVE,
    startDate: 'Jan 14, 2026',
    endDate: 'Aug 29, 2026',
    budget: 2500000,
  },
  {
    id: '2',
    name: 'Riverside Apartments',
    status: STATUS_ACTIVE,
    startDate: 'Jan 31, 2026',
    endDate: 'Dec 14, 2026',
    budget: 1800000,
  },
  {
    id: '3',
    name: 'Highway Bridge Repair',
    status: STATUS_ACTIVE,
    startDate: 'Oct 31, 2025',
    endDate: 'May 30, 2026',
    budget: 950000,
  },
  {
    id: '4',
    name: 'Shopping Mall Extension',
    status: STATUS_COMPLETED,
    startDate: 'Mar 1, 2025',
    endDate: 'Dec 31, 2025',
    budget: 4200000,
  },
];

// ─── Filter options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS: SelectOption[] = [
  { label: 'All', value: STATUS_ALL },
  { label: 'Active', value: STATUS_ACTIVE },
  { label: 'Completed', value: STATUS_COMPLETED },
];

// ─── Status badge styles ──────────────────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  active: 'bg-success/10 text-success',
  completed: 'bg-muted text-muted-foreground',
};

const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  active: 'bg-success',
  completed: 'bg-muted-foreground',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  completed: 'Completed',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

/**
 * Pill badge showing a project's current status with a colored dot.
 */
function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[status]}`}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface ProjectCardProps {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Card displaying a single project's key info and action buttons.
 */
function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card
      title={project.name}
      action={
        <div className="flex w-full gap-2 border-t pt-4">
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
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-muted p-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {project.startDate} – {project.endDate}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>
            {BUDGET_LABEL}{' '}
            <span className="font-semibold text-foreground">
              {formatBudget(project.budget)}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Project Management page — lists all projects with search and status filter.
 */
export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(STATUS_ALL);

  const filtered = MOCK_PROJECTS.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === STATUS_ALL || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{PAGE_TITLE}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {PAGE_DESCRIPTION}
            </p>
          </div>
          <Button>
            <Plus />
            {NEW_PROJECT_BUTTON}
          </Button>
        </div>

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

        {/* Project grid or empty state */}
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
                onView={() => {
                  // TODO: navigate to project detail
                }}
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
      </div>
    </div>
  );
}
