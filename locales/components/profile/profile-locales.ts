import type { DashboardUserRole } from '@/constants/components/dashboard/dashboard-constants';

export const PROFILE_TEXT = {
  pageTitle: 'Your profile',
  pageSubtitle: 'Review your account details and workspace access.',
  avatarAlt: 'Profile avatar',
  accountDetailsTitle: 'Account details',
  accountDetailsDescription: 'Your personal and organization information.',
  nameLabel: 'Name',
  emailLabel: 'Email',
  organizationLabel: 'Organization',
  memberSinceLabel: 'Member since',
  accessTitle: 'Role access',
  accessDescription: 'Your available features are based on your current role.',
  roleDescriptions: {
    CREW: 'Focus on assigned work and the resources needed in the field.',
    FOREMAN: 'Coordinate projects, inventory, materials, and crew onboarding.',
    OWNER: 'Oversee the full organization, operations, and team access.',
  } satisfies Record<DashboardUserRole, string>,
  capabilities: {
    viewProjects: 'View projects and job details',
    viewTools: 'View tool inventory and availability',
    trackAssignments: 'Keep up with assigned field work',
    manageProjects: 'Create and manage projects',
    manageTools: 'Manage tool inventory and checkouts',
    manageMaterials: 'Manage materials and usage',
    onboardCrew: 'Onboard crew members',
    manageTeam: 'Manage crew and organization access',
    inviteForemen: 'Invite foremen to the organization',
  } as Record<string, string>,
} as const;
