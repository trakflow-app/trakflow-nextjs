'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';
import {
  PROJECTS_MANAGEMENT,
  PROJECT_STATUS_OPTIONS,
} from '@/constants/components/projects/projects-constants';
import { PROJECTS_VALIDATION_TEXT } from '@/locales/app/(dashboard)/projects/projects-page-locales';
import type { Database } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type ProjectRow = Database['public']['Tables']['projects']['Row'];

/**
 * Result shape returned by project mutation server actions.
 * Includes either an error or the changed project payload.
 */
export type ProjectActionState = {
  error?: string;
  project?: ProjectRow;
  success?: boolean;
};

/**
 * Extracts and validates form values for project mutations, returning a consistent shape or null if invalid.
 * Validation includes required fields, known enum values, numeric parsing, and logical constraints (e.g. end date after start date).
 */
type ProjectFormValues = {
  name: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  budgetAmount: number | null;
};

/**
 * Helper to safely extract and trim string values from FormData, returning null for missing or empty values.
 */
function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  // FormData values can be string or File, but we only expect strings for our form fields. Non-string values are treated as invalid.
  if (typeof value !== 'string') {
    return null;
  }

  // Trim whitespace and return null for empty strings to enforce required fields and prevent accidental input of only spaces.
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

/**
 * Type guard to validate that a given string is a known ProjectStatus enum value, ensuring type safety for status fields.
 */
function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUS_OPTIONS.some((option) => option.value === value);
}

/**
 * Parses a budget amount from a string, returning a number or null. Validates that the input is a finite number greater than zero, and returns NaN for invalid numeric inputs to trigger schema validation errors.
 */
function parseBudgetAmount(value: string | null): number | null {
  if (!value) return null;

  const budgetAmount = Number(value);

  if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
    return Number.NaN;
  }

  return budgetAmount;
}

/**
 * Extracts, validates, and transforms form data for project creation and updates, returning a consistent shape for service functions or null if validation fails. This centralizes form handling logic and ensures that service functions receive well-formed data.
 */
function getProjectFormValues(formData: FormData): ProjectFormValues | null {
  const name = getFormString(formData, PROJECTS_MANAGEMENT.FORM_KEYS.name);
  const startDate = getFormString(
    formData,
    PROJECTS_MANAGEMENT.FORM_KEYS.startDate,
  );
  const endDate = getFormString(
    formData,
    PROJECTS_MANAGEMENT.FORM_KEYS.endDate,
  );
  const status = getFormString(formData, PROJECTS_MANAGEMENT.FORM_KEYS.status);
  const budgetAmount = parseBudgetAmount(
    getFormString(formData, PROJECTS_MANAGEMENT.FORM_KEYS.budgetAmount),
  );

  // The database requires name/start date and accepts only known statuses.
  if (
    !name ||
    !startDate ||
    !status ||
    !isProjectStatus(status) ||
    Number.isNaN(budgetAmount)
  ) {
    return null;
  }

  // The initial schema rejects an end date before the start date.
  if (endDate && endDate < startDate) {
    return null;
  }

  return {
    name,
    startDate,
    endDate,
    status,
    budgetAmount,
  };
}

/**
 * Determines if a given user role has permissions to manage projects based on predefined manager roles, centralizing permission logic for reuse across service functions and UI components.
 */
function canManageProjects(role: string | null): boolean {
  return PROJECTS_MANAGEMENT.MANAGER_ROLES.includes(
    role as (typeof PROJECTS_MANAGEMENT.MANAGER_ROLES)[number],
  );
}

/**
 * Server-side guard to ensure the user is an organization member and has project management permissions before allowing access to project mutation actions. Returns the user's account information and any permission error message, enabling service functions to enforce access control and provide user-friendly error feedback without relying solely on database-level RLS errors.
 */
async function requireProjectManager() {
  const { account } = await requireOrgMember();

  // RLS also enforces this, but services return a friendlier error first.
  if (!canManageProjects(account.role)) {
    return {
      account,
      error: PROJECTS_VALIDATION_TEXT.permissionDenied,
    };
  }

  return { account, error: null };
}

/**
 * Creates a project scoped to the current user's organization.
 * Only owners and foremen can create projects.
 */
export async function createProjectAction(
  formData: FormData,
): Promise<ProjectActionState> {
  const { account, error: permissionError } = await requireProjectManager();
  const values = getProjectFormValues(formData);

  if (permissionError) {
    return { error: permissionError };
  }

  if (!values) {
    return { error: PROJECTS_VALIDATION_TEXT.invalidProject };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      org_id: account.org_id as string,
      project_name: values.name,
      start_date: values.startDate,
      end_date: values.endDate,
      status: values.status,
      budget_amount: values.budgetAmount,
    })
    .select(
      'id, org_id, project_name, status, start_date, end_date, budget_amount, created_at',
    )
    .single();

  if (error) {
    return { error: PROJECTS_VALIDATION_TEXT.createFailed };
  }

  revalidatePath(PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH);

  return { success: true, project: data };
}

/**
 * Updates a project scoped to the current user's organization.
 * Only owners and foremen can update projects.
 */
export async function updateProjectAction(
  formData: FormData,
): Promise<ProjectActionState> {
  const { account, error: permissionError } = await requireProjectManager();
  const id = getFormString(formData, PROJECTS_MANAGEMENT.FORM_KEYS.id);
  const values = getProjectFormValues(formData);

  if (permissionError) {
    return { error: permissionError };
  }

  if (!id) {
    return { error: PROJECTS_VALIDATION_TEXT.invalidProjectId };
  }

  if (!values) {
    return { error: PROJECTS_VALIDATION_TEXT.invalidProject };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .update({
      project_name: values.name,
      start_date: values.startDate,
      end_date: values.endDate,
      status: values.status,
      budget_amount: values.budgetAmount,
    })
    .eq('id', id)
    .eq('org_id', account.org_id as string)
    .select(
      'id, org_id, project_name, status, start_date, end_date, budget_amount, created_at',
    )
    .single();

  if (error) {
    return { error: PROJECTS_VALIDATION_TEXT.updateFailed };
  }

  revalidatePath(PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH);
  revalidatePath(`${PROJECTS_MANAGEMENT.ROUTES.PROJECTS_PATH}/${id}`);

  return { success: true, project: data };
}
