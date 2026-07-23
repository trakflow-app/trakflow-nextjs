import * as z from 'zod';
import {
  TOOL_CONDITION_VALUES,
  TOOL_MANUAL_STATUS_VALUES,
} from '@/constants/components/tools/tools-constants';
import type { Database } from '@/lib/types/database.types';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];

const ENUM_NORMALIZE_PATTERN = /[\s-]+/g;

/**
 * Maps free-text status values (CSV/OCR) onto the strict manual-status enum.
 */
export function normalizeToolStatus(value: string): ToolStatus | null {
  const normalized = value.trim().toUpperCase().replace(ENUM_NORMALIZE_PATTERN, '_');
  return (TOOL_MANUAL_STATUS_VALUES as readonly string[]).includes(normalized)
    ? (normalized as ToolStatus)
    : null;
}

/**
 * Maps free-text condition values (CSV/OCR) onto the strict condition enum.
 */
export function normalizeToolCondition(value: string): ToolCondition | null {
  const normalized = value.trim().toUpperCase().replace(ENUM_NORMALIZE_PATTERN, '_');
  return (TOOL_CONDITION_VALUES as readonly string[]).includes(normalized)
    ? (normalized as ToolCondition)
    : null;
}

/**
 * Server-side trust boundary for a single tool row before it is inserted.
 */
export const importToolRowSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(TOOL_MANUAL_STATUS_VALUES),
  condition: z.enum(TOOL_CONDITION_VALUES),
  notes: z.string().trim().nullable().optional(),
});

/**
 * Server-side trust boundary for a single material row before it is inserted.
 * `unit_cost` and `unit_qty` are NOT NULL in the database, so both are required here.
 */
export const importMaterialRowSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().min(0),
  unitCost: z.number().positive(),
  lowStockThreshold: z.number().min(0).default(0),
});

export type ImportToolRowInput = z.infer<typeof importToolRowSchema>;
export type ImportMaterialRowInput = z.infer<typeof importMaterialRowSchema>;
