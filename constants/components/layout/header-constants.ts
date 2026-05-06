import { HEADER_HOME_LABEL } from '@/locales/components/layout/header-locales';

export const HEADER_HOME_HREF = '/';
export const HEADER_MOBILE_NAVIGATION_ID = 'mobile-navigation';
export const HEADER_AVATAR_METADATA_KEYS = {
  avatarUrl: 'avatar_url',
  picture: 'picture',
  fullName: 'full_name',
  name: 'name',
} as const;

export const HEADER_NAVIGATION_ITEMS = [
  {
    href: HEADER_HOME_HREF,
    label: HEADER_HOME_LABEL,
  },
] as const;

export const HEADER_SHELL_CLASS_NAME =
  'sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80';
export const HEADER_INNER_CLASS_NAME =
  'mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8';
export const HEADER_DESKTOP_NAV_CLASS_NAME =
  'hidden items-center gap-1 md:flex';
export const HEADER_MOBILE_MENU_CLASS_NAME =
  'border-t border-border bg-background px-4 py-3 md:hidden';
