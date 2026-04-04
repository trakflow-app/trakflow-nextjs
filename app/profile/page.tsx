'use client';
import { PROFILE_PAGE_COPY } from '@/locales/app/profile/en';
import { ProfileManagement } from '@/components/profile/profile-management';
import type {
  OrganizationFormValues,
  ProfileFormValues,
  UserRole,
} from '@/components/profile/types';

/**
 * This are the endpoints for sending the requests and how to format them
 * TODO: Does this need to be here or in separate file constant/config file
 */
const PROFILE_API_ENDPOINT = '/api/profile';
const ORGANIZATION_API_ENDPOINT = '/api/organization';
const JSON_CONTENT_TYPE = 'application/json';
// TODO: This is still mocked at the page level until a real auth/session source is wired in.
const CURRENT_USER_ROLE: UserRole = 'foreman';

/**
 * Saves personal profile updates through the profile API route.
 */
async function handleProfileSave(values: ProfileFormValues) {
  const profilePageText = PROFILE_PAGE_COPY;
  const response = await fetch(PROFILE_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify(values),
  });

  const responseBody = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(responseBody?.message ?? profilePageText.saveError);
  }

  return { message: responseBody?.message ?? profilePageText.saveSuccess };
}

/**
 * Saves organization updates through the organization API route.
 */
async function handleOrganizationSave(values: OrganizationFormValues) {
  const profilePageText = PROFILE_PAGE_COPY;
  const response = await fetch(ORGANIZATION_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': JSON_CONTENT_TYPE,
    },
    body: JSON.stringify({
      ...values,
      userRole: CURRENT_USER_ROLE,
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      responseBody?.message ?? profilePageText.organizationSaveError,
    );
  }

  return {
    message: responseBody?.message ?? profilePageText.organizationSaveSuccess,
  };
}

/**
 * Simple profile page for viewing and editing user information.
 */
export default function ProfilePage() {
  const profilePageText = PROFILE_PAGE_COPY;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-3 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {profilePageText.title}
      </h1>
      <p className="text-sm text-muted-foreground">
        {profilePageText.description}
      </p>
      <ProfileManagement
        currentUserRole={CURRENT_USER_ROLE}
        initialProfileValues={{
          name: 'Cindy Mae Ngoho',
          role: CURRENT_USER_ROLE,
          avatarUrl: 'https://cdn.example.com/cindy-avatar.jpg',
          emailAddress: 'cindy@example.com',
        }}
        initialOrganizationValues={{
          name: 'TrakFlow',
        }}
        onSaveProfile={handleProfileSave}
        onSaveOrganization={handleOrganizationSave}
        showOrganizationSection={true}
      />
    </main>
  );
}
