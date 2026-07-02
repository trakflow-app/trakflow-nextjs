// Page header copy for the projects management page.
export const PROJECTS_PAGE_TEXT = {
  title: 'Projects',
  description: 'Manage your construction projects',
};

// Button, dialog, and manager-only action copy.
export const PROJECTS_ACTION_TEXT = {
  newProjectButton: 'New Project',
  createTitle: 'Create Project',
  createDescription: 'Add a project for your organization.',
  editTitle: 'Edit Project',
  editDescription: 'Update this project details.',
  cancel: 'Cancel',
  save: 'Save Project',
  saveFailed: 'Project could not be saved.',
  saving: 'Saving...',
  viewButton: 'View',
  editButton: 'Edit',
  budgetLabel: 'Budget:',
  noBudget: 'No budget set',
  noEndDate: 'Ongoing',
  managementOnly: 'Only owners and foremen can create or edit projects.',
};

// Search, filter, and empty-state copy.
export const PROJECTS_LIST_TEXT = {
  searchPlaceholder: 'Search projects...',
  filterPlaceholder: 'Filter by status',
  emptyTitle: 'No projects found',
  emptyDescription:
    'No projects match your current filters. Try adjusting your search or create a new project.',
  emptyAction: 'Create Project',
};

// Pagination copy for the projects list.
export const PROJECTS_PAGINATION_TEXT = {
  pageSizeLabel: 'Rows per page',
  previousButton: 'Previous',
  nextButton: 'Next',
  summary: 'Page {currentPage} of {totalPages}',
};

// Field labels and placeholders for the project form.
export const PROJECTS_FORM_TEXT = {
  nameLabel: 'Project Name',
  namePlaceholder: 'Downtown remodel',
  startDateLabel: 'Start Date',
  endDateLabel: 'End Date',
  statusLabel: 'Status',
  budgetLabel: 'Budget',
  budgetPlaceholder: '0.00',
};

// Validation and server action messages for project mutations.
export const PROJECTS_VALIDATION_TEXT = {
  invalidProject: 'Project details are invalid.',
  invalidProjectId: 'Project id is required.',
  nameRequired: 'Project name is required.',
  startDateRequired: 'Start date is required.',
  endDateBeforeStart: 'End date must be on or after the start date.',
  budgetMustBePositive: 'Budget must be greater than 0.',
  permissionDenied: 'Only owners and foremen can manage projects.',
  createFailed: 'Project could not be created.',
  updateFailed: 'Project could not be updated.',
};
