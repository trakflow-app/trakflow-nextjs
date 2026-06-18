import { Skeleton } from '@/components/ui/skeleton';
import {
  DASHBOARD_LOADING_CARD_COUNT,
  DASHBOARD_LOADING_ROW_COUNT,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

/**
 * Displays a shared loading placeholder during dashboard route navigation.
 */
export function DashboardPageLoading() {
  // Create stable placeholder groups for summary cards and list rows.
  const summaryCards = Array.from(
    { length: DASHBOARD_LOADING_CARD_COUNT },
    (_, index) => index,
  );
  const listRows = Array.from(
    { length: DASHBOARD_LOADING_ROW_COUNT },
    (_, index) => index,
  );

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8"
      aria-label={DASHBOARD_TEXT.loadingPage}
      aria-busy="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((cardIndex) => (
          <Skeleton key={cardIndex} className="h-32 w-full" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        {listRows.map((rowIndex) => (
          <Skeleton key={rowIndex} className="h-20 w-full" />
        ))}
      </div>

      <span className="sr-only">{DASHBOARD_TEXT.loadingPage}</span>
    </main>
  );
}
