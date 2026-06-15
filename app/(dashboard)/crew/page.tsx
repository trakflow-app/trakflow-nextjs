import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CrewCodeCard } from '@/components/crew/crew-code-card';
import {
  FOREMAN_INVITE_ROUTE,
  OWNER_INVITE_ROUTE,
} from '@/constants/components/dashboard/dashboard-constants';
import { requireAnyRole } from '@/lib/dal/auth';
import { getOrgJoinCode } from '@/lib/dal/orgs';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

/**
 * Crew management tab for foreman and owner users.
 */
export default async function CrewManagementPage() {
  // Make sure only foremen and owners can access this page, and fetch the org join code for display.
  const { account } = await requireAnyRole(['FOREMAN', 'OWNER']);
  const joinCode = await getOrgJoinCode(account.org_id as string);
  const isOwner = account.role === 'OWNER';

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

        <CrewCodeCard joinCode={joinCode} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isOwner
                ? DASHBOARD_TEXT.crewManagement.ownerActionsTitle
                : DASHBOARD_TEXT.crewManagement.foremanActionsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? DASHBOARD_TEXT.crewManagement.ownerActionsDescription
                : DASHBOARD_TEXT.crewManagement.foremanActionsDescription}
            </p>
            <div className="flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <Button asChild>
                    <Link href={OWNER_INVITE_ROUTE}>
                      {DASHBOARD_TEXT.crewManagement.addTeamMembersAction}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={OWNER_INVITE_ROUTE}>
                      {DASHBOARD_TEXT.crewManagement.pendingInvitesAction}
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href={FOREMAN_INVITE_ROUTE}>
                    {DASHBOARD_TEXT.crewManagement.shareCrewCodeAction}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
