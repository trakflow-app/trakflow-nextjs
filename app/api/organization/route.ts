import { NextResponse } from 'next/server';
import type {
  OrganizationFormValues,
  UserRole,
} from '@/components/profile/types';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_FORBIDDEN = 403;
const EMPTY_VALUE_LENGTH = 0;
const ORGANIZATION_UPDATE_SUCCESS_MESSAGE =
  'Your organization has been updated.';
const FORBIDDEN_ORGANIZATION_UPDATE_MESSAGE =
  'You do not have permission to edit the organization.';
const INVALID_ORGANIZATION_PAYLOAD_MESSAGE =
  'Please complete the organization name before saving.';
const EDITABLE_ORGANIZATION_ROLES: UserRole[] = ['admin', 'foreman'];

/**
 * Organization update payload expected by the backend route.
 */
interface OrganizationUpdateRequest extends OrganizationFormValues {
  userRole: UserRole;
}

/**
 * Checks whether the incoming request body matches the expected organization payload.
 */
function isOrganizationUpdateRequest(
  value: unknown,
): value is OrganizationUpdateRequest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const organizationValueRecord = value as Record<string, unknown>;

  return (
    typeof organizationValueRecord.name === 'string' &&
    typeof organizationValueRecord.userRole === 'string'
  );
}

/**
 * Updates organization details for users who have the correct role.
 */
export async function POST(request: Request) {
  const requestBody: unknown = await request.json().catch(() => null);

  if (!isOrganizationUpdateRequest(requestBody)) {
    return NextResponse.json(
      { message: INVALID_ORGANIZATION_PAYLOAD_MESSAGE },
      { status: HTTP_STATUS_BAD_REQUEST },
    );
  }

  if (requestBody.name.trim().length === EMPTY_VALUE_LENGTH) {
    return NextResponse.json(
      { message: INVALID_ORGANIZATION_PAYLOAD_MESSAGE },
      { status: HTTP_STATUS_BAD_REQUEST },
    );
  }

  if (!EDITABLE_ORGANIZATION_ROLES.includes(requestBody.userRole)) {
    return NextResponse.json(
      { message: FORBIDDEN_ORGANIZATION_UPDATE_MESSAGE },
      { status: HTTP_STATUS_FORBIDDEN },
    );
  }

  return NextResponse.json(
    { message: ORGANIZATION_UPDATE_SUCCESS_MESSAGE },
    { status: HTTP_STATUS_OK },
  );
}
