import { redirect } from 'next/navigation';
import { DASHBOARD_ROUTE } from '@/constants/components/dashboard/dashboard-constants';

/**
 * Redirects legacy owner dashboard links to the shared dashboard.
 */
export default async function OwnerDashboardPage() {
  redirect(DASHBOARD_ROUTE);
}
