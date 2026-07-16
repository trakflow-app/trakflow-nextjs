import type { DashboardUserRole } from '@/constants/components/dashboard/dashboard-constants';

export const PROFILE_DATE_LOCALE = 'en-US';

export const PROFILE_DATE_FORMAT_OPTIONS = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
} as const;

export const PROFILE_ROLE_CAPABILITY_KEYS: Record<
  DashboardUserRole,
  readonly string[]
> = {
  CREW: ['viewProjects', 'viewTools', 'trackAssignments'],
  FOREMAN: ['manageProjects', 'manageTools', 'manageMaterials', 'onboardCrew'],
  OWNER: [
    'manageProjects',
    'manageTools',
    'manageMaterials',
    'manageTeam',
    'inviteForemen',
  ],
};
