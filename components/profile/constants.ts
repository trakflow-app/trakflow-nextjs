import type {
  OrganizationFormValues,
  ProfileFieldConfig,
  ProfileFormValues,
} from './types';
import type { ProfileCopy } from '@/locales/components/profile/en';

// These suffixes are combined with useId() so each rendered profile module gets unique IDs.
export const PROFILE_AVATAR_UPLOAD_INPUT_ID_SUFFIX = 'profile-avatar-upload';
export const PROFILE_AVATAR_IMAGE_SIZE = 80;

export const DEFAULT_PROFILE_VALUES: ProfileFormValues = {
  name: '',
  role: '',
  avatarUrl: '',
  emailAddress: '',
};

export const DEFAULT_ORGANIZATION_VALUES: OrganizationFormValues = {
  name: '',
};

export const FORM_STATE = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
} as const;

/**
 * Builds the default profile field configuration from localized copy.
 */
export function getDefaultProfileFields(
  copy: ProfileCopy,
): ProfileFieldConfig<ProfileFormValues>[] {
  return [
    {
      key: 'name',
      label: copy.fieldLabels.name,
      placeholder: copy.placeholders.name,
      required: true,
      type: 'text',
    },
    {
      key: 'emailAddress',
      label: copy.fieldLabels.emailAddress,
      placeholder: copy.placeholders.emailAddress,
      required: true,
      type: 'email',
    },
  ];
}

/**
 * Builds the default organization field configuration from localized copy.
 */
export function getDefaultOrganizationFields(
  copy: ProfileCopy,
): ProfileFieldConfig<OrganizationFormValues>[] {
  return [
    {
      key: 'name',
      label: copy.fieldLabels.organizationEntityName,
      placeholder: copy.placeholders.organizationEntityName,
      required: true,
      type: 'text',
    },
  ];
}

export const VALID_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMPTY_VALUE_LENGTH = 0;
// Keep the accepted file types explicit so the upload control and validation stay aligned.
export const AVATAR_FILE_INPUT_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/gif';
