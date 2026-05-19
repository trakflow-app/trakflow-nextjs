import * as z from 'zod';

/**
 * Schema for logging material usage
 */
export const createUsageSchema = (maxQty: number) =>
  z.object({
    projectId: z.string().min(1, 'Please select a project'),
    quantityUsed: z.coerce
      .number()
      .positive('Quantity must be greater than 0')
      .max(maxQty, `Only ${maxQty} units available`),
    notes: z.string().optional(),
  });

export type SchemaType = ReturnType<typeof createUsageSchema>;
export type UsageFormInput = z.input<SchemaType>;
export type UsageFormOutput = z.output<SchemaType>;

/**
 * Schema for editing a material
 */
export const editMaterialSchema = z.object({
  name: z.string().min(3, 'Material name must be at least 3 characters'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Please specify a unit'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative'),
  minQuantity: z.coerce
    .number()
    .min(0, 'Low stock threshold cannot be negative'),
});

export type EditMaterialSchemaType = typeof editMaterialSchema;
export type EditMaterialFormInput = z.input<EditMaterialSchemaType>;
export type EditMaterialFormOutput = z.output<EditMaterialSchemaType>;
