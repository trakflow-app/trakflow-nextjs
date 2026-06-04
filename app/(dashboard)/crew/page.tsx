import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAnyRole } from '@/lib/dal/auth';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

/**
 * Crew management tab for foreman and owner users.
 */
export default async function CrewManagementPage() {
  await requireAnyRole(['FOREMAN', 'OWNER']);

  return (
    <main className="bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {DASHBOARD_TEXT.crewManagement.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {DASHBOARD_TEXT.crewManagement.subtitle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {DASHBOARD_TEXT.tabs.crew}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {DASHBOARD_TEXT.crewManagement.placeholder}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
