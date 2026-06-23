/**
 * Destination for the standard login route.
 */
export const HOME_PAGE_LOGIN_HREF = '/login';

/**
 * Destination for account registration.
 */
export const HOME_PAGE_SIGNUP_HREF = '/signup';

/**
 * Anchor destinations used by landing-page navigation.
 */
export const HOME_PAGE_ANCHORS = {
  features: '#features',
  workflow: '#workflow',
  pricing: '#pricing',
} as const;

/**
 * Current home page feature image.
 */
export const HOME_PAGE_IMAGE_SRC = '/construction-site-03.jpg';

/**
 * Secondary home page image.
 */
export const HOME_PAGE_SECONDARY_IMAGE_SRC = '/construction-site-02.jpg';

/**
 * Intrinsic dimensions for landing-page images.
 */
export const HOME_PAGE_IMAGE_SIZE = {
  width: 1920,
  height: 1280,
} as const;

/**
 * Shared width constraint for landing-page content.
 */
export const HOME_PAGE_CONTAINER_CLASS_NAME =
  'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10';
