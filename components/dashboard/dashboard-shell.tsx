import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import LogoutButton from '@/components/auth/logout-button';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import {
  DASHBOARD_COMPANY_ICON,
  DASHBOARD_ROLE_BADGE_VARIANTS,
  DASHBOARD_SHELL_LOGO_SIZE,
  DASHBOARD_TABS_BY_ROLE,
  PROFILE_ROUTE,
  type DashboardUserRole,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

type DashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  organizationCode: string;
  userName: string;
  role: DashboardUserRole;
};

/**
 * Provides the shared role-aware dashboard chrome.
 */
export function DashboardShell({
  children,
  organizationName,
  organizationCode,
  userName,
  role,
}: DashboardShellProps) {
  const CompanyIcon = DASHBOARD_COMPANY_ICON;
  const tabs = DASHBOARD_TABS_BY_ROLE[role];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              style={{
                width: DASHBOARD_SHELL_LOGO_SIZE,
                height: DASHBOARD_SHELL_LOGO_SIZE,
              }}
            >
              <CompanyIcon aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">
                {organizationName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {DASHBOARD_TEXT.organizationCodePrefix} {organizationCode}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={PROFILE_ROUTE}
              className="max-w-28 rounded-md text-right outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-none"
            >
              <p className="truncate text-sm font-medium">{userName}</p>
              <Badge
                className="hidden sm:inline-flex"
                variant={DASHBOARD_ROLE_BADGE_VARIANTS[role]}
              >
                {DASHBOARD_TEXT.roleLabels[role]}
              </Badge>
            </Link>
            <LogoutButton variant="ghost" />
          </div>
        </div>
        <DashboardTabs tabs={tabs} />
      </header>

      {children}
    </div>
  );
}
