import * as z from 'zod';

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
