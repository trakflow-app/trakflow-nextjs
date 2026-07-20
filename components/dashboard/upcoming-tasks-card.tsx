import { CalendarX2Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DASHBOARD_PRIORITY_ACCENT_CLASS_NAMES,
  DASHBOARD_PRIORITY_VARIANTS,
  type DashboardPriority,
} from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';
import { cn } from '@/lib/utils';

export type UpcomingTask = {
  title: string;
  due: string;
  priority: DashboardPriority;
};

type UpcomingTasksCardProps = {
  tasks: UpcomingTask[];
};

/**
 * Shows upcoming work reminders for the dashboard.
 */
export function UpcomingTasksCard({ tasks }: UpcomingTasksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {DASHBOARD_TEXT.upcomingTasksTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length ? (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <article
                key={`${task.title}-${task.due}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border-l-4 bg-muted p-3',
                  DASHBOARD_PRIORITY_ACCENT_CLASS_NAMES[task.priority],
                )}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {task.title}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {DASHBOARD_TEXT.dueLabel} {task.due}
                  </p>
                </div>
                <Badge variant={DASHBOARD_PRIORITY_VARIANTS[task.priority]}>
                  {DASHBOARD_TEXT.taskPriorities[task.priority]}
                </Badge>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarX2Icon}
            title={DASHBOARD_TEXT.emptyTasksTitle}
            description={DASHBOARD_TEXT.emptyTasksDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}
