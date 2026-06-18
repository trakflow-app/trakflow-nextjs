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
  STORAGE: {
    TOOL_IMAGES_BUCKET: 'tool-images',
    TOOL_EVIDENCE_BUCKET: 'tool-evidence',
    TOOL_IMAGES_PATH_PREFIX: 'tools',
    TOOL_CATALOG_IMAGES_PATH_PREFIX: 'catalog',
    SIGNED_URL_EXPIRES_IN_SECONDS: 3_600,
  },
  FILTERS: {
    ALL: 'all',
    INVENTORY_PROJECT_VALUE: 'inventory',
  },
  QUERY_PARAMS: {
    page: 'page',
    pageSize: 'pageSize',
    project: 'project',
    search: 'search',
    status: 'status',
    type: 'type',
  },
  DEFAULTS: {
    FIRST_PAGE: 1,
    PAGE_SIZE: 6,
    TOOL_STATUS: 'AVAILABLE' as ToolStatus,
    TOOL_CONDITION: 'GOOD' as ToolCondition,
  },
  LIMITS: {
    IMAGE_PLACEHOLDER_SIZE: 48,
  },
  IMAGE_SIZES: {
    CARD: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
    DETAIL: '(min-width: 1024px) 768px, 100vw',
  },
  FILES: {
    IMAGE_ACCEPT: 'image/*',
    COMPRESSED_IMAGE_TYPE: 'image/webp',
    COMPRESSED_IMAGE_EXTENSION: 'webp',
    CATALOG_IMAGE_MAX_WIDTH: 800,
    EVIDENCE_IMAGE_MAX_WIDTH: 1_200,
    CATALOG_IMAGE_QUALITY: 0.78,
    EVIDENCE_IMAGE_QUALITY: 0.76,
    MAX_IMAGE_BYTES: 3_000_000,
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
  FORM_KEYS: {
    id: 'id',
    name: 'name',
    status: 'status',
    condition: 'condition',
    projectId: 'projectId',
    imageFile: 'imageFile',
    notes: 'notes',
    toolId: 'toolId',
    checkoutCondition: 'checkoutCondition',
    checkoutNotes: 'checkoutNotes',
    checkoutSessionName: 'checkoutSessionName',
    returnCondition: 'returnCondition',
    returnNotes: 'returnNotes',
    returnImageFile: 'returnImageFile',
  },
} as const;

export const TOOL_STATUS_VALUES = [
  'AVAILABLE',
  'CHECKEDOUT',
  'OUT_OF_SERVICE',
  'ARCHIVED',
] as const satisfies readonly ToolStatus[];

export const TOOL_MANUAL_STATUS_VALUES = [
  'AVAILABLE',
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

export const TOOL_STATUS_OPTIONS: SelectOption[] =
  TOOL_MANUAL_STATUS_VALUES.map((value) => ({
    value,
    label: TOOL_STATUS_LABELS[value],
  }));

export const TOOL_CONDITION_OPTIONS: SelectOption[] = Object.entries(
  TOOL_CONDITION_LABELS,
).map(([value, label]) => ({ value, label }));

export const TOOL_CHECKOUT_CONDITION_OPTIONS: SelectOption[] = [
  'GOOD',
  'FAIR',
  'DAMAGED',
].map((value) => ({
  value,
  label: TOOL_CONDITION_LABELS[value as ToolCondition],
}));

export const TOOL_STATUS_VARIANTS: Record<
  ToolStatus,
  'secondary' | 'warning' | 'outline' | 'destructive'
> = {
  AVAILABLE: 'secondary',
  CHECKEDOUT: 'warning',
  OUT_OF_SERVICE: 'destructive',
  ARCHIVED: 'outline',
};
