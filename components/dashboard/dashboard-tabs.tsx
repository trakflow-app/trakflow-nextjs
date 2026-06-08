'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  FolderKanban,
  Gauge,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type {
  DashboardTabIconKey,
  DashboardTabItem,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';
import { cn } from '@/lib/utils';

const ACTIVE_TAB_CLASS_NAME = 'border-primary text-primary bg-background';
const INACTIVE_TAB_CLASS_NAME =
  'border-transparent text-muted-foreground hover:text-foreground';

type DashboardTabsProps = {
  tabs: DashboardTabItem[];
};

const DASHBOARD_TAB_ICONS: Record<DashboardTabIconKey, LucideIcon> = {
  dashboard: Gauge,
  projects: FolderKanban,
  tools: Wrench,
  materials: Boxes,
  crew: Users,
};

/**
 * Renders the role-specific dashboard top navigation.
 */
export function DashboardTabs({ tabs }: DashboardTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={DASHBOARD_TEXT.tabsLabel}
      className="flex overflow-x-auto border-t border-border px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-7xl gap-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const TabIcon = DASHBOARD_TAB_ICONS[tab.iconKey];

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                isActive ? ACTIVE_TAB_CLASS_NAME : INACTIVE_TAB_CLASS_NAME,
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <TabIcon aria-hidden="true" className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
