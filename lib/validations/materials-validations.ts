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

export type UsageFormInput = z.infer<ReturnType<typeof createUsageSchema>>;
export type UsageFormOutput = z.output<ReturnType<typeof createUsageSchema>>;

/**
 * Schema for editing a material
 */
export const editMaterialSchema = z.object({
  name: z.string().min(3, 'Material name must be at least 3 characters'),
  quantity: z.coerce.number<number>().min(0, 'Quantity cannot be negative'),
  unitCost: z.coerce.number<number>().min(0, 'Unit cost cannot be negative'),
  minQuantity: z.coerce
    .number<number>()
    .min(0, 'Low stock threshold cannot be negative'),
});

export type EditMaterialFormInput = z.infer<typeof editMaterialSchema>;
