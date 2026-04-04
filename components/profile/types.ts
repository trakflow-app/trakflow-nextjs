/**
 * Supported input types for profile field rendering.
 */
export type ProfileFieldType = 'text' | 'email' | 'url' | 'textarea';

/**
 * Shared string-keyed object shape for form values.
 */
export interface FormValues {
  [key: string]: string;
}

/**
 * Profile form values.
 */
export interface ProfileFormValues extends FormValues {
  name: string;
  role: string;
  avatarUrl: string;
  emailAddress: string;
}

/**
 * Organization creation form values.
 */
export interface OrganizationFormValues extends FormValues {
  name: string;
}

/**
 * Access levels supported by the profile page.
 */
export type UserRole = 'crew' | 'admin' | 'foreman';

/**
 * Basic request state for async form flows.
 */
export type FormState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Common shape for async action results.
 */
export interface ActionResult {
  message?: string;
}

/**
 * Configurable field definition used by profile and organization forms.
 */
export interface ProfileFieldConfig<TValues extends FormValues> {
  key: keyof TValues;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: ProfileFieldType;
  helperText?: string;
}

/**
 * Props for the reusable profile management component.
 */
export interface ProfileManagementProps {
  currentUserRole: UserRole;
  initialProfileValues?: Partial<ProfileFormValues>;
  initialOrganizationValues?: Partial<OrganizationFormValues>;
  profileFields?: ProfileFieldConfig<ProfileFormValues>[];
  organizationFields?: ProfileFieldConfig<OrganizationFormValues>[];
  onSaveProfile: (values: ProfileFormValues) => Promise<ActionResult | void>;
  onSaveOrganization?: (
    values: OrganizationFormValues,
  ) => Promise<ActionResult | void>;
  showOrganizationSection?: boolean;
  className?: string;
}
