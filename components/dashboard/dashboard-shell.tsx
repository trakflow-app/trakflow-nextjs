import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import LogoutButton from '@/components/auth/logout-button';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import {
  DASHBOARD_COMPANY_ICON,
  DASHBOARD_ROLE_BADGE_VARIANTS,
  DASHBOARD_SHELL_LOGO_SIZE,
  DASHBOARD_TABS_BY_ROLE,
  type DashboardUserRole,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

type DashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  userName: string;
  role: DashboardUserRole;
};

/**
 * Provides the shared role-aware dashboard chrome.
 */
export function DashboardShell({
  children,
  organizationName,
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
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{userName}</p>
              <Badge variant={DASHBOARD_ROLE_BADGE_VARIANTS[role]}>
                {DASHBOARD_TEXT.roleLabels[role]}
              </Badge>
            </div>
            <LogoutButton variant="ghost" />
          </div>
        </div>
        <DashboardTabs tabs={tabs} />
      </header>

      {children}
    </div>
  );
}
