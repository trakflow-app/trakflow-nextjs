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
  QUERY_PARAMS: {
    page: 'page',
    pageSize: 'pageSize',
    search: 'search',
    status: 'status',
  },
  DEFAULTS: {
    FIRST_PAGE: 1,
    PAGE_SIZE: 6,
  },
  PAGE_SIZES: {
    SMALL: 6,
    MEDIUM: 12,
    LARGE: 24,
  },
  SEARCH_DEBOUNCE_MS: 300,
  PAGE_SUMMARY_TOKENS: {
    CURRENT_PAGE: '{currentPage}',
    TOTAL_PAGES: '{totalPages}',
  },
  ROUTES: {
    PROJECTS_PATH: '/projects',
  },
  MANAGER_ROLES: ['OWNER', 'FOREMAN'],
} as const;

export const PROJECT_STATUS_VALUES = [
  'ACTIVE',
  'COMPLETED',
] as const satisfies readonly ProjectStatus[];

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

export const PROJECT_PAGE_SIZE_OPTIONS: SelectOption[] = [
  {
    label: String(PROJECTS_MANAGEMENT.PAGE_SIZES.SMALL),
    value: String(PROJECTS_MANAGEMENT.PAGE_SIZES.SMALL),
  },
  {
    label: String(PROJECTS_MANAGEMENT.PAGE_SIZES.MEDIUM),
    value: String(PROJECTS_MANAGEMENT.PAGE_SIZES.MEDIUM),
  },
  {
    label: String(PROJECTS_MANAGEMENT.PAGE_SIZES.LARGE),
    value: String(PROJECTS_MANAGEMENT.PAGE_SIZES.LARGE),
  },
];
