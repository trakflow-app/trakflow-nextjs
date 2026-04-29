import { validateForemanInviteToken } from '@/lib/auth/actions';
import SignupForm from '@/components/auth/signup-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signupForemanPage } from '@/locales/app/foreman/auth-signup-foreman-page-locales';
import Link from 'next/link';

/**
 * Foreman registration page via invite token
 */
export default async function InvitePage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = await props.params;

  // Server action to validate token and fetch invite details
  const invite = await validateForemanInviteToken(params.token);

  if (!invite || invite.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-3 rounded-full w-fit">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {signupForemanPage.invalidInviteTitle}
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-400 font-medium">
                {invite?.error ?? signupForemanPage.invalidInviteDescription}
              </CardDescription>
            </div>
          </CardHeader>
          {/* Subtle divider to match the success card */}
          <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

          <CardContent className="pt-6">
            <Link href="/login" className="flex items-center justify-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {signupForemanPage.backToLogin}
            </Link>

            {/* Consistent Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
              <ShieldCheck className="h-3 w-3" />
              {signupForemanPage.foremanLinkVerificationFooter}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // --- Success State (Valid Invite) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-muted-foreground border-slate-200 dark:border-slate-800"
            >
              {signupForemanPage.foremanBadge}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-3 py-1"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {signupForemanPage.verifiedBadge}
            </Badge>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {signupForemanPage.createAccountTitle}
            </CardTitle>
            <CardDescription>
              {signupForemanPage.createAccountDescription}{' '}
              <span className="font-semibold text-foreground">
                {invite.orgName}
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

        <CardContent className="pt-6">
          <SignupForm
            email={invite.email}
            orgId={invite.orgId}
            role="FOREMAN"
            inviteToken={params.token}
          />

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            <ShieldCheck className="h-3 w-3" />
            {signupForemanPage.foremanLinkVerificationFooter}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
