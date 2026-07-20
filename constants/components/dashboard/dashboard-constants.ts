import { Building2 } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

export type DashboardUserRole = Database['public']['Enums']['user_role'];
export type DashboardPriority = 'high' | 'medium' | 'low';

export const DASHBOARD_ROUTE = '/dashboard';
export const PROJECTS_ROUTE = '/projects';
export const TOOLS_ROUTE = '/tools';
export const MATERIALS_ROUTE = '/materials';
export const CREW_MANAGEMENT_ROUTE = '/crew';
export const OWNER_INVITE_ROUTE = '/owner/invite';
export const FOREMAN_INVITE_ROUTE = '/foreman/invite';
export const DEFAULT_ORGANIZATION_NAME = 'Organization';
export const DEFAULT_ORGANIZATION_CODE = 'N/A';
export const RECENT_PROJECTS_LIMIT = 4;
export const MAX_PROGRESS_PERCENT = 100;
export const MIN_PROGRESS_PERCENT = 0;
export const PROJECT_RISK_WINDOW_DAYS = 14;
export const MILLISECONDS_PER_DAY = 86_400_000;
export const EMPTY_PROJECT_PROGRESS_PERCENT = 0;
export const PROJECT_PROGRESS_FALLBACKS = [75, 45, 90, 30] as const;

export const DASHBOARD_SHELL_LOGO_SIZE = 44;
export const DASHBOARD_PROGRESS_BAR_HEIGHT_CLASS_NAME = 'h-2';
export const CREW_CODE_COPY_RESET_DELAY_MS = 2_000;
export const DASHBOARD_LOADING_CARD_COUNT = 4;
export const DASHBOARD_LOADING_ROW_COUNT = 6;
export const PROJECT_DETAIL_LOADING_SECTION_COUNT = 3;
export const PROJECT_DETAIL_LOADING_ROW_COUNT = 3;

export type DashboardTabIconKey =
  | 'dashboard'
  | 'projects'
  | 'tools'
  | 'materials'
  | 'crew';

export type DashboardTabItem = {
  href: string;
  label: string;
  iconKey: DashboardTabIconKey;
};

export const DASHBOARD_TABS_BY_ROLE: Record<
  DashboardUserRole,
  DashboardTabItem[]
> = {
  CREW: [
    {
      href: DASHBOARD_ROUTE,
      label: DASHBOARD_TEXT.tabs.dashboard,
      iconKey: 'dashboard',
    },
    {
      href: PROJECTS_ROUTE,
      label: DASHBOARD_TEXT.tabs.projects,
      iconKey: 'projects',
    },
    {
      href: TOOLS_ROUTE,
      label: DASHBOARD_TEXT.tabs.tools,
      iconKey: 'tools',
    },
  ],
  FOREMAN: [
    {
      href: DASHBOARD_ROUTE,
      label: DASHBOARD_TEXT.tabs.dashboard,
      iconKey: 'dashboard',
    },
    {
      href: PROJECTS_ROUTE,
      label: DASHBOARD_TEXT.tabs.projects,
      iconKey: 'projects',
    },
    {
      href: TOOLS_ROUTE,
      label: DASHBOARD_TEXT.tabs.tools,
      iconKey: 'tools',
    },
    {
      href: MATERIALS_ROUTE,
      label: DASHBOARD_TEXT.tabs.materials,
      iconKey: 'materials',
    },
    {
      href: CREW_MANAGEMENT_ROUTE,
      label: DASHBOARD_TEXT.tabs.crew,
      iconKey: 'crew',
    },
  ],
  OWNER: [
    {
      href: DASHBOARD_ROUTE,
      label: DASHBOARD_TEXT.tabs.dashboard,
      iconKey: 'dashboard',
    },
    {
      href: PROJECTS_ROUTE,
      label: DASHBOARD_TEXT.tabs.projects,
      iconKey: 'projects',
    },
    {
      href: TOOLS_ROUTE,
      label: DASHBOARD_TEXT.tabs.tools,
      iconKey: 'tools',
    },
    {
      href: MATERIALS_ROUTE,
      label: DASHBOARD_TEXT.tabs.materials,
      iconKey: 'materials',
    },
    {
      href: CREW_MANAGEMENT_ROUTE,
      label: DASHBOARD_TEXT.tabs.crew,
      iconKey: 'crew',
    },
  ],
};

export const DASHBOARD_COMPANY_ICON = Building2;

export const DASHBOARD_ROLE_BADGE_VARIANTS = {
  CREW: 'secondary',
  FOREMAN: 'default',
  OWNER: 'outline',
} as const;

export const DASHBOARD_PRIORITY_VARIANTS = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

export const DASHBOARD_PRIORITY_ACCENT_CLASS_NAMES = {
  high: 'border-l-destructive',
  medium: 'border-l-chart-4',
  low: 'border-l-success',
} as const;
