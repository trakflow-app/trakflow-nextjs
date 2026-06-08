import { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import {
  DEFAULT_ORGANIZATION_NAME,
  type DashboardUserRole,
} from '@/constants/components/dashboard/dashboard-constants';
import { requireOrgMember } from '@/lib/dal/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Props for the dashboard layout.
 */
interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Protects all dashboard routes behind authentication.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { account } = await requireOrgMember();
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', account.org_id as string)
    .single();

  return (
    <DashboardShell
      organizationName={organization?.name ?? DEFAULT_ORGANIZATION_NAME}
      userName={account.name}
      role={account.role as DashboardUserRole}
    >
      {children}
    </DashboardShell>
  );
}
