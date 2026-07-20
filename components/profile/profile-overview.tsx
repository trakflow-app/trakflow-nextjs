import { CheckCircle2Icon, MailIcon, Building2Icon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DASHBOARD_ROLE_BADGE_VARIANTS,
  type DashboardUserRole,
} from '@/constants/components/dashboard/dashboard-constants';
import { PROFILE_ROLE_CAPABILITY_KEYS } from '@/constants/components/profile/profile-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';
import { PROFILE_TEXT } from '@/locales/components/profile/profile-locales';

interface ProfileOverviewProps {
  name: string;
  email: string;
  organizationName: string;
  memberSince: string;
  role: DashboardUserRole;
  avatarUrl?: string;
}

/**
 * Displays authenticated account details and role-specific access.
 */
export function ProfileOverview({
  name,
  email,
  organizationName,
  memberSince,
  role,
  avatarUrl,
}: ProfileOverviewProps) {
  const capabilityKeys = PROFILE_ROLE_CAPABILITY_KEYS[role];

  return (
    <main className="bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {PROFILE_TEXT.pageTitle}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {PROFILE_TEXT.pageSubtitle}
          </p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Avatar
              size="xl"
              src={avatarUrl}
              name={name}
              alt={PROFILE_TEXT.avatarAlt}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <CardTitle className="truncate">{name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MailIcon aria-hidden="true" className="size-4" />
                <span className="truncate">{email}</span>
              </CardDescription>
              <Badge variant={DASHBOARD_ROLE_BADGE_VARIANTS[role]}>
                {DASHBOARD_TEXT.roleLabels[role]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {PROFILE_TEXT.accountDetailsTitle}
              </CardTitle>
              <CardDescription>
                {PROFILE_TEXT.accountDetailsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    {PROFILE_TEXT.nameLabel}
                  </dt>
                  <dd className="font-medium">{name}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    {PROFILE_TEXT.emailLabel}
                  </dt>
                  <dd className="break-all font-medium">{email}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    {PROFILE_TEXT.organizationLabel}
                  </dt>
                  <dd className="flex items-center gap-2 font-medium">
                    <Building2Icon aria-hidden="true" className="size-4" />
                    {organizationName}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    {PROFILE_TEXT.memberSinceLabel}
                  </dt>
                  <dd className="font-medium">{memberSince}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {PROFILE_TEXT.accessTitle}
              </CardTitle>
              <CardDescription>
                {PROFILE_TEXT.accessDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                {PROFILE_TEXT.roleDescriptions[role]}
              </p>
              <ul className="flex flex-col gap-3">
                {capabilityKeys.map((capabilityKey) => (
                  <li
                    key={capabilityKey}
                    className="flex items-start gap-3 text-sm"
                  >
                    <CheckCircle2Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>{PROFILE_TEXT.capabilities[capabilityKey]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
