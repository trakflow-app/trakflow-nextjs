import { ReactNode } from 'react';
import { getAuthenticatedUser } from '@/lib/auth/actions';
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
  await createClient();
  await getAuthenticatedUser();
  return <>{children}</>;
}
