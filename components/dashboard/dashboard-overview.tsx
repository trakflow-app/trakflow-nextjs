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
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {DASHBOARD_TEXT.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {DASHBOARD_TEXT.pageSubtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentProjectsCard projects={projects} />
          <UpcomingTasksCard tasks={upcomingTasks} />
        </div>
      </div>
    </main>
  );
}
