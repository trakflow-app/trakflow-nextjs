'use client';

import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import LogoutButton from '@/components/auth/logout-button';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  HEADER_DESKTOP_NAV_CLASS_NAME,
  HEADER_MOBILE_MENU_CLASS_NAME,
  HEADER_MOBILE_NAVIGATION_ID,
  HEADER_NAVIGATION_ITEMS,
} from '@/constants/components/layout/header-constants';
import {
  HEADER_AUTHENTICATED_USER_LABEL,
  HEADER_GUEST_USER_LABEL,
  HEADER_MENU_CLOSE_LABEL,
  HEADER_MENU_OPEN_LABEL,
  HEADER_MOBILE_NAVIGATION_LABEL,
  HEADER_NAVIGATION_LABEL,
} from '@/locales/components/layout/header-locales';

export interface HeaderUser {
  name: string;
  avatarUrl?: string;
}

interface HeaderNavigationProps {
  user: HeaderUser | null;
}

export function HeaderNavigation({ user }: HeaderNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = Boolean(user);
  const avatarLabel = user?.name ?? HEADER_GUEST_USER_LABEL;
  const menuLabel = isMenuOpen
    ? HEADER_MENU_CLOSE_LABEL
    : HEADER_MENU_OPEN_LABEL;
  const MenuToggleIcon = isMenuOpen ? XIcon : MenuIcon;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-primary">
      <nav
        aria-label={HEADER_NAVIGATION_LABEL}
        className={HEADER_DESKTOP_NAV_CLASS_NAME}
      >
        {HEADER_NAVIGATION_ITEMS.map((item) => (
          <Button key={item.href} asChild variant="ghost">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
        {isAuthenticated ? <LogoutButton /> : null}
      </nav>

      <Avatar
        size="sm"
        src={user?.avatarUrl}
        name={avatarLabel}
        alt={
          isAuthenticated
            ? HEADER_AUTHENTICATED_USER_LABEL
            : HEADER_GUEST_USER_LABEL
        }
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={menuLabel}
        aria-controls={HEADER_MOBILE_NAVIGATION_ID}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <MenuToggleIcon data-icon="inline-start" aria-hidden="true" />
      </Button>

      {isMenuOpen ? (
        <div
          id={HEADER_MOBILE_NAVIGATION_ID}
          className="absolute top-full right-0 left-0"
        >
          <nav
            aria-label={HEADER_MOBILE_NAVIGATION_LABEL}
            className={HEADER_MOBILE_MENU_CLASS_NAME}
          >
            <div className="flex flex-col gap-2">
              {HEADER_NAVIGATION_ITEMS.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className="justify-start"
                >
                  <Link href={item.href} onClick={() => setIsMenuOpen(false)}>
                    {item.label}
                  </Link>
                </Button>
              ))}
              {isAuthenticated ? (
                <LogoutButton className="justify-start" />
              ) : null}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
