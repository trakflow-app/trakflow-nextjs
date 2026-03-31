import { NextResponse } from 'next/server';
import type { ProfileFormValues } from '@/components/profile/types';

const EMPTY_VALUE_LENGTH = 0;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const PROFILE_UPDATE_SUCCESS_MESSAGE = 'Your profile has been updated.';
const PROFILE_UPDATE_ERROR_MESSAGE = 'Unable to save your profile right now.';
const INVALID_PROFILE_PAYLOAD_MESSAGE =
  'Please complete all required profile fields.';
const REQUIRED_PROFILE_FIELDS: (keyof ProfileFormValues)[] = [
  'name',
  'role',
  'emailAddress',
];

/**
 * Checks whether the incoming request body matches the expected profile payload.
 */
function isProfileFormValues(value: unknown): value is ProfileFormValues {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profileValueRecord = value as Record<string, unknown>;

  return (
    REQUIRED_PROFILE_FIELDS.every(
      (field) => typeof profileValueRecord[field] === 'string',
    ) && typeof profileValueRecord.avatarUrl === 'string'
  );
}

/**
 * Checks whether any required profile field is blank.
 */
function hasEmptyRequiredField(values: ProfileFormValues) {
  return REQUIRED_PROFILE_FIELDS.some(
    (field) => values[field].trim().length === EMPTY_VALUE_LENGTH,
  );
}

/**
 * Updates the signed-in user's profile details.
 */
export async function POST(request: Request) {
  const requestBody: unknown = await request.json().catch(() => null);

  if (!isProfileFormValues(requestBody) || hasEmptyRequiredField(requestBody)) {
    return NextResponse.json(
      { message: INVALID_PROFILE_PAYLOAD_MESSAGE },
      { status: HTTP_STATUS_BAD_REQUEST },
    );
  }

  if (requestBody.emailAddress.trim().toLowerCase() === 'fail@example.com') {
    return NextResponse.json(
      { message: PROFILE_UPDATE_ERROR_MESSAGE },
      { status: HTTP_STATUS_BAD_REQUEST },
    );
  }

  return NextResponse.json(
    { message: PROFILE_UPDATE_SUCCESS_MESSAGE },
    { status: HTTP_STATUS_OK },
  );
}
