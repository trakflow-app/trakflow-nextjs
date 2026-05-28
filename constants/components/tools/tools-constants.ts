import type { SelectOption } from '@/components/ui/select-field';
import type { Database } from '@/lib/types/database.types';
import {
  TOOL_CONDITION_LABELS,
  TOOLS_PAGE_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];

/**
 * Shared constants for tools management components and services.
 */
export const TOOLS_MANAGEMENT = {
  ROUTES: {
    TOOLS_PATH: '/tools',
  },
  FILTERS: {
    ALL: 'all',
    INVENTORY_PROJECT_VALUE: 'inventory',
  },
  DEFAULTS: {
    FIRST_PAGE: 1,
    PAGE_SIZE: 6,
    TOOL_STATUS: 'AVAILABLE' as ToolStatus,
    TOOL_CONDITION: 'GOOD' as ToolCondition,
  },
  LIMITS: {
    MIN_TAG_NUMBER: 1,
    IMAGE_PLACEHOLDER_SIZE: 48,
  },
  FILES: {
    IMAGE_ACCEPT: 'image/*',
  },
  PAGE_SIZES: {
    SMALL: 6,
    MEDIUM: 12,
    LARGE: 24,
  },
  PAGE_SUMMARY_TOKENS: {
    CURRENT_PAGE: '{currentPage}',
    TOTAL_PAGES: '{totalPages}',
  },
  FORM_KEYS: {
    id: 'id',
    name: 'name',
    tagNumber: 'tagNumber',
    status: 'status',
    condition: 'condition',
    projectId: 'projectId',
    imageFile: 'imageFile',
    notes: 'notes',
  },
} as const;

export const TOOL_STATUS_VALUES = [
  'AVAILABLE',
  'CHECKEDOUT',
  'OUT_OF_SERVICE',
  'ARCHIVED',
] as const satisfies readonly ToolStatus[];

export const TOOL_CONDITION_VALUES = [
  'GOOD',
  'FAIR',
  'DAMAGED',
  'OUT_OF_SERVICE',
] as const satisfies readonly ToolCondition[];

export const TOOL_PAGE_SIZE_OPTIONS: SelectOption[] = [
  {
    label: String(TOOLS_MANAGEMENT.PAGE_SIZES.SMALL),
    value: String(TOOLS_MANAGEMENT.PAGE_SIZES.SMALL),
  },
  {
    label: String(TOOLS_MANAGEMENT.PAGE_SIZES.MEDIUM),
    value: String(TOOLS_MANAGEMENT.PAGE_SIZES.MEDIUM),
  },
  {
    label: String(TOOLS_MANAGEMENT.PAGE_SIZES.LARGE),
    value: String(TOOLS_MANAGEMENT.PAGE_SIZES.LARGE),
  },
];

export const TOOL_STATUS_FILTER_OPTIONS: SelectOption[] = [
  {
    label: TOOLS_PAGE_TEXT.allStatuses,
    value: TOOLS_MANAGEMENT.FILTERS.ALL,
  },
  ...Object.entries(TOOL_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export const TOOL_TYPE_FILTER_OPTIONS: SelectOption[] = [
  {
    label: TOOLS_PAGE_TEXT.allTypes,
    value: TOOLS_MANAGEMENT.FILTERS.ALL,
  },
  { label: TOOLS_PAGE_TEXT.inventoryType, value: 'INVENTORY' },
  { label: TOOLS_PAGE_TEXT.assignedType, value: 'ASSIGNED' },
];

export const TOOL_STATUS_OPTIONS: SelectOption[] = Object.entries(
  TOOL_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

export const TOOL_CONDITION_OPTIONS: SelectOption[] = Object.entries(
  TOOL_CONDITION_LABELS,
).map(([value, label]) => ({ value, label }));

export const TOOL_STATUS_VARIANTS: Record<
  ToolStatus,
  'secondary' | 'outline' | 'destructive'
> = {
  AVAILABLE: 'secondary',
  CHECKEDOUT: 'outline',
  OUT_OF_SERVICE: 'destructive',
  ARCHIVED: 'outline',
};
