'use client';

import { useState } from 'react';
import { FolderOpen, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { SearchFilter } from '../../../../components/search-filter';
import type { SelectOption } from '../../../../components/select-field';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectStatus = 'active' | 'completed';

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline: string;
  budget: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'completed';

const PAGE_TITLE = 'Projects';
const PAGE_DESCRIPTION = 'View and manage all your projects in one place.';
const BTN_NEW_PROJECT = 'New Project';
const BTN_VIEW = 'View';
const BTN_EDIT = 'Edit';
const BTN_DELETE = 'Delete';
const SEARCH_PLACEHOLDER = 'Search projects...';
const FILTER_PLACEHOLDER = 'Filter by status';
const EMPTY_TITLE = 'No projects found';
const EMPTY_DESC_FILTERED = 'Try adjusting your search or filter.';
const EMPTY_DESC_DEFAULT = 'Get started by creating your first project.';
const LABEL_DEADLINE = 'Deadline';
const LABEL_BUDGET = 'Budget';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Active',
  completed: 'Completed',
};

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: 'bg-success/10 text-success',
  completed: 'bg-muted text-muted-foreground',
};

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Riverside Office Build',
    status: 'active',
    deadline: 'Dec 15, 2025',
    budget: '$48,000',
  },
  {
    id: '2',
    name: 'Westside Renovation',
    status: 'completed',
    deadline: 'Sep 30, 2025',
    budget: '$22,500',
  },
  {
    id: '3',
    name: 'Harbour View Fit-Out',
    status: 'active',
    deadline: 'Jan 20, 2026',
    budget: '$67,000',
  },
  {
    id: '4',
    name: 'Downtown Loft Remodel',
    status: 'active',
    deadline: 'Feb 10, 2026',
    budget: '$31,200',
  },
  {
    id: '5',
    name: 'Eastbridge Site Prep',
    status: 'completed',
    deadline: 'Mar 5, 2026',
    budget: '$15,800',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Displays a single project's name, status, deadline, budget, and actions.
 */
function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
  return (
    <Card
      title={project.name}
      action={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(project.id)}
          >
            <Eye />
            {BTN_VIEW}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(project.id)}
          >
            <Pencil />
            {BTN_EDIT}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 />
            {BTN_DELETE}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <span
          className={cn(
            'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_STYLES[project.status],
          )}
        >
          {STATUS_LABELS[project.status]}
        </span>
        <span className="text-sm text-muted-foreground">
          {LABEL_DEADLINE}: {project.deadline}
        </span>
        <span className="text-sm text-muted-foreground">
          {LABEL_BUDGET}: {project.budget}
        </span>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Projects page — lists all projects with search and status filtering.
 * Actions (View, Edit, Delete) are stubbed until API routes are ready.
 */
export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredProjects = MOCK_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  ).filter((p) => statusFilter === 'all' || p.status === statusFilter);

  const handleView = () => {
    /* TODO: navigate to project detail */
  };
  const handleEdit = () => {
    /* TODO: open edit modal */
  };
  const handleDelete = () => {
    /* TODO: confirm and delete */
  };
  const handleCreate = () => {
    /* TODO: open create project modal */
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{PAGE_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {PAGE_DESCRIPTION}
          </p>
        </div>
        <Button onClick={handleCreate}>{BTN_NEW_PROJECT}</Button>
      </div>

      {/* Search + status filter */}
      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={SEARCH_PLACEHOLDER}
        filterOptions={STATUS_FILTER_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={(value: string) =>
          setStatusFilter(value as StatusFilter)
        }
        filterPlaceholder={FILTER_PLACEHOLDER}
      />

      {/* Project grid / empty state */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={EMPTY_TITLE}
          description={
            searchQuery || statusFilter !== 'all'
              ? EMPTY_DESC_FILTERED
              : EMPTY_DESC_DEFAULT
          }
          actionText={
            searchQuery || statusFilter !== 'all' ? undefined : BTN_NEW_PROJECT
          }
          onActionClick={handleCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
