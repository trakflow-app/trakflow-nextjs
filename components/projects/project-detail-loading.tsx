import { Skeleton } from '@/components/ui/skeleton';
import {
  PROJECT_DETAIL_LOADING_ROW_COUNT,
  PROJECT_DETAIL_LOADING_SECTION_COUNT,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

/**
 * Displays the project detail layout while its primary data is loading.
 */
export function ProjectDetailLoading() {
  // Create stable placeholders for the tools, materials, and team sections.
  const sections = Array.from(
    { length: PROJECT_DETAIL_LOADING_SECTION_COUNT },
    (_, index) => index,
  );

  // Create stable rows reused inside each detail section.
  const rows = Array.from(
    { length: PROJECT_DETAIL_LOADING_ROW_COUNT },
    (_, index) => index,
  );

  return (
    <main
      className="min-h-screen bg-background px-6 py-8"
      aria-label={DASHBOARD_TEXT.loadingProjectDetails}
      aria-busy="true"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-32" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>

          <div className="flex flex-wrap gap-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {sections.map((sectionIndex) => (
          <section key={sectionIndex} className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              {rows.map((rowIndex) => (
                <Skeleton
                  key={`${sectionIndex}-${rowIndex}`}
                  className="h-9 w-full"
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <span className="sr-only">{DASHBOARD_TEXT.loadingProjectDetails}</span>
    </main>
  );
}
