export const DASHBOARD_TEXT = {
  loadingPage: 'Loading dashboard content',
  loadingProjectDetails: 'Loading project details',
  loadingToolDetails: 'Loading tool details',
  organizationCodePrefix: 'Code:',
  tabsLabel: 'Dashboard sections',
  tabs: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    tools: 'Tools',
    materials: 'Materials',
    crew: 'Crew',
  },
  roleLabels: {
    CREW: 'CREW',
    FOREMAN: 'FOREMAN',
    OWNER: 'OWNER',
  },
  pageTitle: 'Dashboard',
  pageSubtitle: "Welcome back! Here's your construction overview",
  recentProjectsTitle: 'Recent Projects',
  upcomingTasksTitle: 'Upcoming Tasks',
  projectManagerLabel: 'Manager:',
  unassignedManagerLabel: 'Unassigned',
  noProjectEndDateLabel: 'No due date',
  emptyProjectsTitle: 'No projects yet',
  emptyProjectsDescription: 'Projects will appear here after they are created.',
  emptyTasksTitle: 'No upcoming tasks',
  emptyTasksDescription: 'Scheduled work and reminders will appear here.',
  dueLabel: 'Due:',
  projectStatuses: {
    onTrack: 'On Track',
    atRisk: 'At Risk',
    delayed: 'Delayed',
    completed: 'Completed',
  },
  taskPriorities: {
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  /**
   * TODO: Replace with persisted scheduled task data when task management ships.
   */
  mockTasks: [
    {
      title: 'Foundation inspection - Downtown Office',
      due: 'Tomorrow',
      priority: 'high',
    },
    {
      title: 'Material delivery - Riverside Apartments',
      due: 'Apr 8',
      priority: 'medium',
    },
    {
      title: 'Safety audit - Highway Bridge',
      due: 'Apr 10',
      priority: 'high',
    },
    {
      title: 'Client meeting - Shopping Mall',
      due: 'Apr 12',
      priority: 'low',
    },
    {
      title: 'Electrical inspection - Office Complex',
      due: 'Apr 15',
      priority: 'medium',
    },
  ],
  crewManagement: {
    title: 'Crew',
    subtitle: 'Manage crew onboarding and team access',
    shareCodeTitle: 'Share crew code',
    shareCodeDescription:
      'Reveal the organization join code only when you are ready to onboard crew.',
    shareCodeGuidance:
      'Share this code only with people who should join this organization.',
    noCode: 'No join code available.',
    hiddenCode: 'Code hidden',
    revealCodeButton: 'Reveal code',
    hideCodeButton: 'Hide code',
    copyCodeButton: 'Copy code',
    codeCopiedButton: 'Copied',
    ownerActionsTitle: 'Owner onboarding',
    ownerActionsDescription:
      'Invite foremen by email and review pending invite links.',
    addTeamMembersAction: 'Add team members',
    pendingInvitesAction: 'Pending invites',
    foremanActionsTitle: 'Foreman onboarding',
    foremanActionsDescription: 'Open the dedicated share page for crew joins.',
    shareCrewCodeAction: 'Share crew code',
  },
} as const;
