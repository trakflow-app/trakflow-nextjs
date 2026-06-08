export const TOOLS_PAGE_TEXT = {
  title: 'Tools',
  subtitle: 'View your organization tools and current project assignments.',
  addToolButton: 'Add Tool',
  searchPlaceholder: 'Search by tool name',
  statusFilterPlaceholder: 'Filter by status',
  typeFilterPlaceholder: 'Filter by type',
  projectFilterPlaceholder: 'Filter by project',
  statusFilterLabel: 'Status',
  typeFilterLabel: 'Type',
  projectFilterLabel: 'Project',
  allStatuses: 'All statuses',
  allTypes: 'All types',
  allProjects: 'All projects',
  inventoryType: 'Org inventory',
  assignedType: 'Project assigned',
  noToolsTitle: 'No tools found',
  noToolsDescription:
    'No tools match your current filters. Try adjusting your search or filters.',
  loadFailed: 'Failed to load tools.',
};

export const TOOLS_CARD_TEXT = {
  viewAction: 'View',
  editAction: 'Edit',
  deleteAction: 'Delete',
  checkoutAction: 'Check out',
  checkinAction: 'Check in',
  tagPrefix: 'Tag',
  assignedProjectLabel: 'Project',
  inventoryProjectLabel: 'Inventory',
  statusHeader: 'Status',
  conditionHeader: 'Condition',
  noImageAlt: 'Tool image placeholder',
};

export const TOOL_DETAILS_TEXT = {
  title: 'Tool Details',
  description: 'Review the current tool record.',
  backButton: 'Back to Tools',
  closeButton: 'Close',
  tagLabel: 'Tag',
  nameLabel: 'Name',
  typeLabel: 'Type',
  projectLabel: 'Project',
  imageAttachmentLabel: 'Image attachment',
  statusLabel: 'Status',
  conditionLabel: 'Condition',
  notesLabel: 'Notes',
  noNotes: 'No notes added.',
  imageLabel: 'Image',
  noImageLabel: 'Image placeholder',
};

export const TOOL_EDIT_TEXT = {
  title: 'Edit Tool',
  description: 'Update the tool details and project assignment.',
  nameLabel: 'Name',
  tagNumberLabel: 'Tag number',
  projectLabel: 'Project',
  imageAttachmentLabel: 'Image attachment',
  statusLabel: 'Status',
  conditionLabel: 'Condition',
  notesLabel: 'Notes',
  cancelButton: 'Cancel',
  saveButton: 'Save changes',
};

export const TOOL_CREATE_TEXT = {
  title: 'Add Tool',
  description: 'Create a tool record and assign it to inventory or a project.',
  nameLabel: 'Name',
  tagNumberLabel: 'Tag number',
  projectLabel: 'Project',
  imageAttachmentLabel: 'Image attachment',
  statusLabel: 'Status',
  conditionLabel: 'Condition',
  notesLabel: 'Notes',
  cancelButton: 'Cancel',
  createButton: 'Create tool',
};

export const TOOL_DELETE_TEXT = {
  title: 'Delete Tool',
  description:
    'This permanently removes the tool record from your organization.',
  confirmButton: 'Delete tool',
  cancelButton: 'Cancel',
};

export const TOOL_CHECKOUT_TEXT = {
  title: 'Check Out Tool',
  description:
    'Record the current condition before this tool leaves inventory.',
  conditionLabel: 'Checkout condition',
  sessionNameLabel: 'Session name',
  notesLabel: 'Notes',
  cancelButton: 'Cancel',
  confirmButton: 'Check out',
};

export const TOOL_RETURN_TEXT = {
  title: 'Check In Tool',
  description: 'Record the return condition and optional evidence photo.',
  conditionLabel: 'Return condition',
  evidenceImageLabel: 'Evidence photo',
  notesLabel: 'Notes',
  cancelButton: 'Cancel',
  confirmButton: 'Check in',
};

export const TOOLS_PAGINATION_TEXT = {
  pageSizeLabel: 'Rows per page',
  previousButton: 'Previous',
  nextButton: 'Next',
  summary: 'Page {currentPage} of {totalPages}',
};

export const TOOLS_ACTION_TEXT = {
  invalidTool: 'Enter valid tool details.',
  invalidCheckout: 'Enter valid checkout details.',
  invalidReturn: 'Enter valid return details.',
  unauthorized: 'You do not have permission to manage tools.',
  imageTooLarge: 'Upload a smaller tool image.',
  imageInvalid: 'Upload a valid image file.',
  imageUploadFailed: 'Failed to upload the tool image.',
  evidenceUploadFailed: 'Failed to upload the evidence photo.',
  createFailed: 'Failed to create tool.',
  createSuccess: 'Tool created.',
  updateFailed: 'Failed to update tool.',
  updateSuccess: 'Tool updated.',
  deleteFailed: 'Failed to delete tool.',
  deleteSuccess: 'Tool deleted.',
  checkoutFailed: 'Failed to check out tool.',
  checkoutSuccess: 'Tool checked out.',
  returnFailed: 'Failed to check in tool.',
  returnSuccess: 'Tool checked in.',
};

export const TOOLS_STATS_TEXT = {
  totalTools: 'Total Tools',
  availableTools: 'Available',
  checkedOutTools: 'Checked Out',
  serviceTools: 'Needs Service',
};

export const TOOL_STATUS_LABELS = {
  AVAILABLE: 'Available',
  CHECKEDOUT: 'Checked out',
  OUT_OF_SERVICE: 'Out of service',
  ARCHIVED: 'Archived',
};

export const TOOL_CONDITION_LABELS = {
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
  OUT_OF_SERVICE: 'Out of service',
};
