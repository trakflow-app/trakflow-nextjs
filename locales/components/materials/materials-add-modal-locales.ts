/**
 * Localization strings for the add material modal.
 */
export const materialsAddModalLocales = {
  title: 'Add Material',
  description: 'Create a new material inventory item.',
  materialNameLabel: 'Material Name',
  materialNamePlaceholder: 'Concrete, lumber, screws...',
  projectLabel: 'Project',
  projectPlaceholder: 'Select a project',
  noProjectsAvailable: 'Create a project before adding materials.',
  quantityLabel: 'Quantity',
  unitCostLabel: 'Unit Cost',
  lowStockLabel: 'Low Stock',
  numberPlaceholder: '0',
  submitButton: 'Add Material',
  submittingButton: 'Adding...',
  loadingOrg: 'Loading organization information... Please wait.',
  createFailed: 'Failed to create material',
  validation: {
    nameRequired: 'Material name is required',
    projectRequired: 'Please select a project',
    quantityMinimum: 'Quantity cannot be negative',
    unitCostRequired: 'Unit cost must be greater than 0',
    lowStockMinimum: 'Low stock cannot be negative',
  },
};
