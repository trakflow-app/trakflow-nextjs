import { RecentProjectsCard } from '@/components/dashboard/recent-projects-card';
import {
  UpcomingTasksCard,
  type UpcomingTask,
} from '@/components/dashboard/upcoming-tasks-card';
import type { ProjectCrewRow } from '@/lib/dal/projects';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

type DashboardOverviewProps = {
  projects: ProjectCrewRow[];
  upcomingTasks?: UpcomingTask[];
};

/**
 * Renders the shared Dashboard tab content.
 */
export function DashboardOverview({
  projects,
  upcomingTasks = [],
}: DashboardOverviewProps) {
  return (
    <main className="bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {DASHBOARD_TEXT.pageTitle}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {DASHBOARD_TEXT.pageSubtitle}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <RecentProjectsCard projects={projects} />
          <UpcomingTasksCard tasks={upcomingTasks} />
        </div>
      </div>
    </main>
  );
}
