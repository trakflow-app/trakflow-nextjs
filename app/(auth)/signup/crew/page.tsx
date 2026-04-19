'use client';
import { useState } from 'react';
import SignupForm from '@/components/auth/signup-form';
import CrewCodeVerificationForm from '@/components/auth/crew-code-verification-form';
import { CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { crewCodeVerificationPage } from '@/locales/app/crew/auth-signup-crew-page-locales';

export default function CrewCodeVerificationPage() {
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [verified, setVerified] = useState(false);

  function handleVerified(name: string, id: string, code: string) {
    setOrgName(name);
    setOrgId(id);
    setOrgCode(code);
    setVerified(true);
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVerified(false)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {crewCodeVerificationPage.back}
              </Button>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-3 py-1"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {crewCodeVerificationPage.verifiedCode}
              </Badge>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {orgName}
              </CardTitle>
              <CardDescription>
                {crewCodeVerificationPage.description}
              </CardDescription>
            </div>
          </CardHeader>

          <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

          <CardContent className="pt-6">
            <SignupForm orgCode={orgCode} orgId={orgId} />

            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
              <ShieldCheck className="h-3 w-3" />
              {crewCodeVerificationPage.descriptionFooter}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <CrewCodeVerificationForm onVerified={handleVerified} />
      </div>
    </div>
  );
}
