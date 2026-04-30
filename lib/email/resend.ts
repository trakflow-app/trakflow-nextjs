import 'server-only';

import { Resend } from 'resend';

const RESEND_ERROR_MESSAGES = {
  missingRequiredEnvironmentVariable: 'Missing required environment variable:',
} as const;
const NEXT_PUBLIC_APP_URL_ENV_NAME = 'NEXT_PUBLIC_APP_URL';
const RESEND_API_KEY_ENV_NAME = 'RESEND_API_KEY';
const RESEND_FROM_EMAIL_ENV_NAME = 'RESEND_FROM_EMAIL';
const TRAILING_SLASH_PATTERN = /\/$/;

let resendClient: Resend | null = null;

/**
 * TODO: Standardize lib/** error handling behind a shared pattern once
 * email sending and invite actions are fully wired.
 */
function createResendError(message: string, detail: string): Error {
  return new Error(`${message} ${detail}`);
}

/**
 * Reads a required environment variable and throws if it is missing.
 */
function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw createResendError(
      RESEND_ERROR_MESSAGES.missingRequiredEnvironmentVariable,
      name,
    );
  }

  return value;
}

/**
 * Returns the singleton Resend client for server-side email sending.
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(
      getRequiredEnvironmentValue(RESEND_API_KEY_ENV_NAME),
    );
  }

  return resendClient;
}

/**
 * Returns the configured sender address for transactional emails.
 */
export function getResendFromEmail(): string {
  return getRequiredEnvironmentValue(RESEND_FROM_EMAIL_ENV_NAME);
}

/**
 * Returns the normalized app URL used to build absolute invite links.
 */
export function getAppUrl(): string {
  return getRequiredEnvironmentValue(NEXT_PUBLIC_APP_URL_ENV_NAME).replace(
    TRAILING_SLASH_PATTERN,
    '',
  );
}
