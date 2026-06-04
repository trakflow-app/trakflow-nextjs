import { redirect } from 'next/navigation';
import { DASHBOARD_ROUTE } from '@/constants/components/dashboard/dashboard-constants';

/**
 * Redirects legacy foreman dashboard links to the shared dashboard.
 */
export default async function ForemanDashboardPage() {
  redirect(DASHBOARD_ROUTE);
}
