/**
 * Localization strings for the add material modal.
 */
export const materialsAddModalLocales = {
  title: 'Add Material',
  description: 'Create a new material inventory item.',
  materialNameLabel: 'Material Name',
  materialNamePlaceholder: 'Concrete, lumber, screws...',
  projectLabel: 'Inventory Location',
  projectPlaceholder: 'Select inventory location',
  orgInventoryOption: 'Org inventory',
  noProjectsAvailable:
    'No projects are available yet. This material can still be added to org inventory.',
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
    quantityMinimum: 'Quantity cannot be negative',
    unitCostRequired: 'Unit cost must be greater than 0',
    lowStockMinimum: 'Low stock cannot be negative',
  },
};
