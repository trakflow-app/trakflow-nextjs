import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

/**
 * Displays the tool detail layout while its primary data is loading.
 */
export function ToolDetailLoading() {
  return (
    <main
      className="min-h-screen bg-background px-6 py-8"
      aria-label={DASHBOARD_TEXT.loadingToolDetails}
      aria-busy="true"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-28" />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-6 w-24" />
          </div>

          <div className="flex flex-wrap gap-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>

        <section className="flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="aspect-video w-full rounded-lg" />
        </section>

        <section className="flex flex-col gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </section>
      </div>

      <span className="sr-only">{DASHBOARD_TEXT.loadingToolDetails}</span>
    </main>
  );
}
