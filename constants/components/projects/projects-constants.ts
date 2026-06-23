import type { SelectOption } from '@/components/ui/select-field';
import type { Database } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];

export const PROJECTS_MANAGEMENT = {
  FORM_KEYS: {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    budgetAmount: 'budgetAmount',
  },
  FILTERS: {
    ALL: 'all',
  },
  ROUTES: {
    PROJECTS_PATH: '/projects',
  },
  MANAGER_ROLES: ['OWNER', 'FOREMAN'],
} as const;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

export const PROJECT_STATUS_OPTIONS: SelectOption[] = [
  { label: PROJECT_STATUS_LABELS.ACTIVE, value: 'ACTIVE' },
  { label: PROJECT_STATUS_LABELS.COMPLETED, value: 'COMPLETED' },
];

export const PROJECT_FILTER_OPTIONS: SelectOption[] = [
  { label: 'All', value: PROJECTS_MANAGEMENT.FILTERS.ALL },
  ...PROJECT_STATUS_OPTIONS,
];
