/**
 * Localization strings for Material Edit Modal component.
 */
export const materialEditModalLocales = {
  title: 'Edit Material',
  loading: 'Loading material details...',
  noMaterialSelected: 'No material selected',
  failedToEditMaterial: 'Failed to edit material details',

  // Helper function for dynamic descriptions
  descriptionWithMaterial: (materialName: string) =>
    `Update the details for ${materialName}`,
};
