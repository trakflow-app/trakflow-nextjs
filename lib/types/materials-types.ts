import { Database } from '@/lib/types/database.types';
import { z } from 'zod';
import { createUsageSchema } from '@/lib/validations/materials-validations';
import { SubmitHandler } from 'react-hook-form';

/**
 * Derive types from the Zod schema - single source of truth.
 */
type SchemaType = ReturnType<typeof createUsageSchema>;

/**
 * What react-hook-form uses internally (before coercion).
 */
export type UsageFormInput = z.input<SchemaType>;

/**
 * What Zod outputs after validation/coercion.
 * quantityUsed is guaranteed to be a number.
 */
export type UsageFormOutput = z.output<SchemaType>;

/**
 * Data submitted to backend after validation.
 */
export type MaterialUsageSubmitData = UsageFormOutput & { materialId: string };

/**
 * Props for MaterialUsageForm component.
 */
export interface MaterialUsageFormProps {
  materialId: string;
  projectName: string;
  currentQuantity: number;
  onSubmit: SubmitHandler<MaterialUsageSubmitData>;
  isSubmitting: boolean;
  defaultProjectId: string;
}

// You CAN reference database types if needed
export type MaterialUsageRecord =
  Database['public']['Tables']['material_usage']['Row'];
