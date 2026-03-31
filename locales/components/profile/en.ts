/**
 * Field labels used in profile and organization forms.
 */
export interface ProfileFieldLabels {
  name: string;
  emailAddress: string;
  organizationEntityName: string;
}

/**
 * Field placeholders used in profile and organization forms.
 */
export interface ProfilePlaceholders {
  name: string;
  emailAddress: string;
  organizationEntityName: string;
}

/**
 * Copy dictionary for all profile component text.
 */
export interface ProfileCopy {
  profileTitle: string;
  profileDescription: string;
  organizationTitle: string;
  organizationDescription: string;
  saveProfileAction: string;
  saveOrganizationAction: string;
  loadingProfileAction: string;
  loadingOrganizationAction: string;
  profileSuccessDefault: string;
  organizationSuccessDefault: string;
  genericErrorDefault: string;
  requiredSuffix: string;
  invalidEmail: string;
  profileBannerPrefix: string;
  organizationBannerPrefix: string;
  roleLabel: string;
  uploadPhotoLabel: string;
  removePhotoLabel: string;
  uploadPhotoHint: string;
  organizationReadOnlyMessage: string;
  fieldLabels: ProfileFieldLabels;
  placeholders: ProfilePlaceholders;
}

/**
 * Shared copy used by the profile management component.
 */
export const PROFILE_COMPONENT_COPY: ProfileCopy = {
  profileTitle: "Your Profile",
  profileDescription:
    "View your profile details and update your personal information.",
  organizationTitle: "Organization",
  organizationDescription:
    "Admins and foremen can update the organization name. Crew members can only view it.",
  saveProfileAction: "Save Profile",
  saveOrganizationAction: "Save Organization",
  loadingProfileAction: "Saving...",
  loadingOrganizationAction: "Saving...",
  profileSuccessDefault: "Profile updated successfully.",
  organizationSuccessDefault: "Organization updated successfully.",
  genericErrorDefault: "Something went wrong. Please try again.",
  requiredSuffix: "is required.",
  invalidEmail: "Please enter a valid email address.",
  profileBannerPrefix: "Profile:",
  organizationBannerPrefix: "Organization:",
  roleLabel: "Access role",
  uploadPhotoLabel: "Upload Photo",
  removePhotoLabel: "Remove Photo",
  uploadPhotoHint: "Choose a JPG, PNG, or GIF image to update your profile photo.",
  organizationReadOnlyMessage:
    "Crew members can view organization details but cannot edit them.",
  fieldLabels: {
    name: "Name",
    emailAddress: "Email address",
    organizationEntityName: "Organization name",
  },
  placeholders: {
    name: "Jane Doe",
    emailAddress: "jane@example.com",
    organizationEntityName: "Acme Inc.",
  },
};
