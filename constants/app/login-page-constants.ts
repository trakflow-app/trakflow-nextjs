/**
 * Destination for account registration.
 */
export const LOGIN_PAGE_SIGNUP_HREF = '/signup';

/**
 * Destination for crew registration with a code.
 */
export const LOGIN_PAGE_CREW_SIGNUP_HREF = '/signup/crew';

/**
 * Feature image displayed beside the login form.
 */
export const LOGIN_PAGE_IMAGE_SRC = '/construction-site-01.jpg';

/**
 * Intrinsic dimensions for the login page feature image.
 */
export const LOGIN_PAGE_IMAGE_SIZE = {
  width: 1920,
  height: 1280,
} as const;

/**
 * Shared presentation classes for secondary login page links.
 */
export const LOGIN_PAGE_SECONDARY_LINK_CLASS_NAME =
  'font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/**
 * Presentation classes for the bordered login page panel.
 */
export const LOGIN_PAGE_PANEL_CLASS_NAME =
  'grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:grid-cols-2';
