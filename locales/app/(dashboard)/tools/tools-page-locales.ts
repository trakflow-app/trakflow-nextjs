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
  namePlaceholder: 'Example: Cordless drill',
  projectLabel: 'Project',
  imageAttachmentLabel: 'Image attachment',
  imageAttachmentButton: 'Replace photo',
  noImageSelected: 'Current photo stays unless you upload a new one',
  statusLabel: 'Status',
  conditionLabel: 'Condition',
  notesLabel: 'Notes',
  notesPlaceholder: 'Update serial number, storage location, or handling notes',
  cancelButton: 'Cancel',
  saveButton: 'Save changes',
};

export const TOOL_CREATE_TEXT = {
  title: 'Add Tool',
  description: 'Create a tool record and assign it to inventory or a project.',
  nameLabel: 'Name',
  namePlaceholder: 'Example: Cordless drill',
  projectLabel: 'Project',
  imageAttachmentLabel: 'Image attachment',
  imageAttachmentButton: 'Upload photo',
  noImageSelected: 'No photo selected',
  statusLabel: 'Status',
  conditionLabel: 'Condition',
  notesLabel: 'Notes',
  notesPlaceholder: 'Add serial number, storage location, or handling notes',
  cancelButton: 'Cancel',
  createButton: 'Create tool',
};

export const TOOL_DELETE_TEXT = {
  title: 'Delete Tool',
  description:
    'This permanently removes the tool record from your organization.',
  checkedOutTitle: 'Tool must be checked in first',
  checkedOutDescription:
    'This tool is currently checked out. Check it in before deleting the tool record.',
  confirmButton: 'Delete tool',
  cancelButton: 'Cancel',
};

export const TOOL_CHECKOUT_TEXT = {
  title: 'Check Out Tool',
  description:
    'Record the current condition before this tool leaves inventory.',
  conditionLabel: 'Checkout condition',
  workActivityLabel: 'Work activity',
  workActivityPlaceholder: 'Example: Morning pickup or Level 2 framing',
  notesLabel: 'Notes',
  notesPlaceholder: 'Add who is taking it, where it is going, or any issues',
  cancelButton: 'Cancel',
  confirmButton: 'Check out',
};

export const TOOL_RETURN_TEXT = {
  title: 'Check In Tool',
  description: 'Record the return condition and optional evidence photo.',
  conditionLabel: 'Return condition',
  evidenceImageLabel: 'Evidence photo',
  evidenceImageButton: 'Upload photo',
  noEvidenceSelected: 'No photo selected',
  notesLabel: 'Notes',
  notesPlaceholder: 'Add damage details, missing parts, or return notes',
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
  deleteCheckedOut: 'Check in this tool before deleting it.',
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
