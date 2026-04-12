import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
