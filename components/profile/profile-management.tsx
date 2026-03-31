"use client";
import Image from "next/image";
import { useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ORGANIZATION_VALUES,
  DEFAULT_PROFILE_VALUES,
  FORM_STATE,
  getDefaultOrganizationFields,
  getDefaultProfileFields,
  AVATAR_FILE_INPUT_ACCEPT,
  EMPTY_VALUE_LENGTH,
  PROFILE_AVATAR_IMAGE_SIZE,
  PROFILE_AVATAR_UPLOAD_INPUT_ID_SUFFIX,
  VALID_EMAIL_PATTERN,
} from "./constants";
import { PROFILE_COMPONENT_COPY } from "@/locales/components/profile/en";
import type {
  FormValues,
  OrganizationFormValues,
  ProfileFieldConfig,
  ProfileFormValues,
  ProfileManagementProps,
  UserRole,
} from "./types";

type FieldErrors<TValues extends FormValues> = Partial<
  Record<keyof TValues, string>
>;

/**
 * Props for the shared form section renderer.
 */
interface FormSectionProps<TValues extends FormValues> {
  bannerPrefix: string;
  title: string;
  description: string;
  actionLabel: string;
  actionLoadingLabel: string;
  state: "idle" | "loading" | "success" | "error";
  statusMessage: string;
  values: TValues;
  fields: ProfileFieldConfig<TValues>[];
  errors: FieldErrors<TValues>;
  onChange: (key: keyof TValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  topContent?: React.ReactNode;
  isReadOnly?: boolean;
  readOnlyMessage?: string;
  showSubmitButton?: boolean;
}

/**
 * Validation copy consumed by the shared field validator.
 */
interface ValidationText {
  requiredSuffix: string;
  invalidEmail: string;
}

/**
 * Fills missing profile values so every input remains controlled.
 */
function normalizeProfileValues(
  initialValues?: Partial<ProfileFormValues>,
): ProfileFormValues {
  const merged = {
    ...DEFAULT_PROFILE_VALUES,
    ...initialValues,
  };
  // Ensure all values are strings (no undefined)
  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value ?? ""]),
  ) as ProfileFormValues;
}

/**
 * Fills missing organization values so every input remains controlled.
 */
function normalizeOrganizationValues(
  initialValues?: Partial<OrganizationFormValues>,
): OrganizationFormValues {
  const merged = {
    ...DEFAULT_ORGANIZATION_VALUES,
    ...initialValues,
  };
  // Ensure all values are strings (no undefined)
  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value ?? ""]),
  ) as OrganizationFormValues;
}

/**
 * Builds a reusable required-field validation message.
 */
function getRequiredFieldError(label: string, requiredSuffix: string): string {
  return `${label} ${requiredSuffix}`;
}

/**
 * Validates shared required-field and email rules for both forms.
 */
function validateFields<TValues extends FormValues>(
  values: TValues,
  fields: ProfileFieldConfig<TValues>[],
  validationText: ValidationText,
): FieldErrors<TValues> {
  const errors: FieldErrors<TValues> = {};

  fields.forEach((field) => {
    const fieldValue = values[field.key].trim();

    if (field.required && fieldValue.length === EMPTY_VALUE_LENGTH) {
      errors[field.key] = getRequiredFieldError(
        field.label,
        validationText.requiredSuffix,
      );
      return;
    }

    if (field.type === "email" && fieldValue.length > 0) {
      if (!VALID_EMAIL_PATTERN.test(fieldValue)) {
        errors[field.key] = validationText.invalidEmail;
      }
    }
  });

  return errors;
}

/**
 * Render the feedback banner after submit success or failure.
 */
function renderBanner(
  prefix: string,
  state: "idle" | "loading" | "success" | "error",
  message: string,
) {
  if (
    state === FORM_STATE.idle ||
    state === FORM_STATE.loading ||
    message.length === 0
  ) {
    return null;
  }

  if (state === FORM_STATE.success) {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        {`${prefix} ${message}`}
      </p>
    );
  }

  if (state === FORM_STATE.error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {`${prefix} ${message}`}
      </p>
    );
  }

  return null;
}

/**
 * Renders one configured profile or organization form section.
 */
function FormSection<TValues extends FormValues>({
  bannerPrefix,
  title,
  description,
  actionLabel,
  actionLoadingLabel,
  state,
  statusMessage,
  values,
  fields,
  errors,
  onChange,
  onSubmit,
  topContent,
  isReadOnly = false,
  readOnlyMessage,
  showSubmitButton = true,
}: FormSectionProps<TValues>) {
  const isLoading = state === FORM_STATE.loading;
  const areInputsDisabled = isReadOnly || isLoading;

  return (
    <Card className="relative overflow-hidden border border-primary/10 bg-card backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent" />
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
          {topContent}
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const fieldKey = String(field.key);
              const fieldError = errors[field.key];
              const fieldValue = values[field.key];

              return (
                <label key={fieldKey} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type ?? "text"}
                    value={fieldValue}
                    placeholder={field.placeholder}
                    disabled={areInputsDisabled}
                    onChange={(event) =>
                      onChange(field.key, event.target.value)
                    }
                  />
                  {field.helperText ? (
                    <span className="text-sm text-muted-foreground">
                      {field.helperText}
                    </span>
                  ) : null}
                  {fieldError ? (
                    <span className="text-sm text-destructive">
                      {fieldError}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          {readOnlyMessage ? (
            <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground">
              {readOnlyMessage}
            </p>
          ) : null}
          {showSubmitButton ? (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? actionLoadingLabel : actionLabel}
            </Button>
          ) : null}
        </form>
        {renderBanner(bannerPrefix, state, statusMessage)}
      </CardContent>
    </Card>
  );
}

/**
 * Reusable profile management component for editing profile details
 * and organization details from the same page.
 */
export function ProfileManagement({
  currentUserRole,
  initialProfileValues,
  initialOrganizationValues,
  profileFields,
  organizationFields,
  onSaveProfile,
  onSaveOrganization,
  showOrganizationSection = true,
  className,
}: ProfileManagementProps) {
  // Generate per-instance IDs so multiple profile cards can exist on the same page.
  const profileSectionId = useId();
  const avatarUploadInputId = `${profileSectionId}-${PROFILE_AVATAR_UPLOAD_INPUT_ID_SUFFIX}`;
  // Load the shared labels, placeholders, and messages used by this feature.
  const copy = PROFILE_COMPONENT_COPY;
  // Use custom field definitions when provided, otherwise fall back to defaults.
  const resolvedProfileFields = useMemo(
    () => profileFields ?? getDefaultProfileFields(copy),
    [copy, profileFields],
  );
  const resolvedOrganizationFields = useMemo(
    () => organizationFields ?? getDefaultOrganizationFields(copy),
    [copy, organizationFields],
  );
  // These state values hold the live contents of both forms.
  const [profileValues, setProfileValues] = useState<ProfileFormValues>(() =>
    normalizeProfileValues(initialProfileValues),
  );
  const [organizationValues, setOrganizationValues] =
    useState<OrganizationFormValues>(() =>
      normalizeOrganizationValues(initialOrganizationValues),
    );
  const [profileErrors, setProfileErrors] = useState<
    FieldErrors<ProfileFormValues>
  >({});
  const [organizationErrors, setOrganizationErrors] = useState<
    FieldErrors<OrganizationFormValues>
  >({});
  const [profileState, setProfileState] = useState<
    "idle" | "loading" | "success" | "error"
  >(FORM_STATE.idle);
  const [organizationState, setOrganizationState] = useState<
    "idle" | "loading" | "success" | "error"
  >(FORM_STATE.idle);
  // These messages are shown inside the success/error banners.
  const [profileMessage, setProfileMessage] = useState("");
  const [organizationMessage, setOrganizationMessage] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // Crew members can view organization details, but only admins/foremen can edit them.
  const canEditOrganization = currentUserRole !== "crew";

  // Merge base layout styles with any extra className from the parent.
  const mergedClassName = useMemo(
    () => cn("w-full max-w-4xl space-y-6", className),
    [className],
  );

  // Update one profile field and clear any old error/banner tied to a past submit.
  const handleProfileChange = (key: keyof ProfileFormValues, value: string) => {
    setProfileValues((previous) => ({
      ...previous,
      [key]: value,
    }));

    setProfileErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));

    if (
      profileState === FORM_STATE.error ||
      profileState === FORM_STATE.success
    ) {
      setProfileState(FORM_STATE.idle);
      setProfileMessage("");
    }
  };

  // Same field-update flow, but for the optional organization section.
  const handleOrganizationChange = (
    key: keyof OrganizationFormValues,
    value: string,
  ) => {
    setOrganizationValues((previous) => ({
      ...previous,
      [key]: value,
    }));

    setOrganizationErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));

    if (
      organizationState === FORM_STATE.error ||
      organizationState === FORM_STATE.success
    ) {
      setOrganizationState(FORM_STATE.idle);
      setOrganizationMessage("");
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setProfileState(FORM_STATE.error);
      setProfileMessage(copy.genericErrorDefault);
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      // Keep the upload flow simple for now by storing a data URL directly in form state.
      const nextAvatarUrl =
        typeof fileReader.result === "string" ? fileReader.result : "";

      if (nextAvatarUrl.length === EMPTY_VALUE_LENGTH) {
        setProfileState(FORM_STATE.error);
        setProfileMessage(copy.genericErrorDefault);
        return;
      }

      handleProfileChange("avatarUrl", nextAvatarUrl);
    };

    fileReader.onerror = () => {
      setProfileState(FORM_STATE.error);
      setProfileMessage(copy.genericErrorDefault);
    };

    fileReader.readAsDataURL(selectedFile);
  };

  const handleAvatarRemove = () => {
    // Clearing both the form value and the hidden input lets the same file be re-selected.
    handleProfileChange("avatarUrl", "");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // Validate locally first, then call the async save function passed in by the page.
  const handleProfileSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const nextErrors = validateFields(
      profileValues,
      resolvedProfileFields,
      copy,
    );

    setProfileErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setProfileState(FORM_STATE.error);
      setProfileMessage(copy.genericErrorDefault);
      return;
    }

    setProfileState(FORM_STATE.loading);
    setProfileMessage("");

    try {
      const result = await onSaveProfile(profileValues);
      setProfileState(FORM_STATE.success);
      setProfileMessage(result?.message ?? copy.profileSuccessDefault);
    } catch (error) {
      setProfileState(FORM_STATE.error);
      if (error instanceof Error && error.message.length > 0) {
        setProfileMessage(error.message);
      } else {
        setProfileMessage(copy.genericErrorDefault);
      }
    }
  };

  // Handle organization updates with the same validate -> submit -> banner pattern.
  const handleOrganizationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    if (!onSaveOrganization || !canEditOrganization) {
      return;
    }

    event.preventDefault();
    const nextErrors = validateFields(
      organizationValues,
      resolvedOrganizationFields,
      copy,
    );

    setOrganizationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setOrganizationState(FORM_STATE.error);
      setOrganizationMessage(copy.genericErrorDefault);
      return;
    }

    setOrganizationState(FORM_STATE.loading);
    setOrganizationMessage("");

    try {
      const result = await onSaveOrganization(organizationValues);
      setOrganizationState(FORM_STATE.success);
      setOrganizationMessage(
        result?.message ?? copy.organizationSuccessDefault,
      );
    } catch (error) {
      setOrganizationState(FORM_STATE.error);
      if (error instanceof Error && error.message.length > 0) {
        setOrganizationMessage(error.message);
      } else {
        setOrganizationMessage(copy.genericErrorDefault);
      }
    }
  };

  const profileTopContent = (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-background">
          {profileValues.avatarUrl ? (
            <Image
              src={profileValues.avatarUrl}
              alt={profileValues.name || copy.profileTitle}
              width={PROFILE_AVATAR_IMAGE_SIZE}
              height={PROFILE_AVATAR_IMAGE_SIZE}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-primary">
              {profileValues.name.trim().charAt(0).toUpperCase() || "P"}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {copy.roleLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatRoleLabel(currentUserRole)}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <Label htmlFor={avatarUploadInputId} className="sr-only">
          {copy.uploadPhotoLabel}
        </Label>
        {/* The native file input stays hidden while the button below triggers it. */}
        <input
          id={avatarUploadInputId}
          ref={avatarInputRef}
          type="file"
          accept={AVATAR_FILE_INPUT_ACCEPT}
          className="hidden"
          title={copy.uploadPhotoLabel}
          onChange={handleAvatarUpload}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => avatarInputRef.current?.click()}
          >
            {copy.uploadPhotoLabel}
          </Button>
          {profileValues.avatarUrl ? (
            <Button type="button" variant="ghost" onClick={handleAvatarRemove}>
              {copy.removePhotoLabel}
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{copy.uploadPhotoHint}</p>
      </div>
    </div>
  );

  return (
    // Render the profile form first, and optionally the organization form after it.
    <div className={mergedClassName}>
      <FormSection
        bannerPrefix={copy.profileBannerPrefix}
        title={copy.profileTitle}
        description={copy.profileDescription}
        actionLabel={copy.saveProfileAction}
        actionLoadingLabel={copy.loadingProfileAction}
        state={profileState}
        statusMessage={profileMessage}
        values={profileValues}
        fields={resolvedProfileFields}
        errors={profileErrors}
        onChange={handleProfileChange}
        onSubmit={handleProfileSubmit}
        topContent={profileTopContent}
      />

      {showOrganizationSection ? (
        <FormSection
          bannerPrefix={copy.organizationBannerPrefix}
          title={copy.organizationTitle}
          description={copy.organizationDescription}
          actionLabel={copy.saveOrganizationAction}
          actionLoadingLabel={copy.loadingOrganizationAction}
          state={organizationState}
          statusMessage={organizationMessage}
          values={organizationValues}
          fields={resolvedOrganizationFields}
          errors={organizationErrors}
          onChange={handleOrganizationChange}
          onSubmit={handleOrganizationSubmit}
          isReadOnly={!canEditOrganization}
          readOnlyMessage={
            canEditOrganization ? undefined : copy.organizationReadOnlyMessage
          }
          showSubmitButton={canEditOrganization && Boolean(onSaveOrganization)}
        />
      ) : null}
    </div>
  );
}

function formatRoleLabel(role: UserRole) {
  // Match the small display label in the UI without changing the stored role value.
  return role.charAt(0).toUpperCase() + role.slice(1);
}
