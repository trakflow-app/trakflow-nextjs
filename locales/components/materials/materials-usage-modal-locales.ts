/**
 * Localization strings for Material Usage Modal component.
 */
export const materialUsageModalLocales = {
  title: 'Log Material Usage',
  descriptionDefault: 'Record material consumption for your project',
  loading: 'Loading material details...',
  noMaterialSelected: 'No material selected',
  failedToLogUsage: 'Failed to log material usage',

  // Helper function for dynamic descriptions
  descriptionWithMaterial: (materialName: string) =>
    `Record consumption for ${materialName}`,
};
