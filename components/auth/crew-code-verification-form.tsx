'use client';
import { useState } from 'react';
import { verifyOrgCode, getOrgNameByCode } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Loader2, ShieldCheck, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { crewCodeVerificationForm } from '@/locales/components/auth/crew-code-verification-form-locales';
import {
  CODE_LENGTH_BEFORE_DASH,
  CODE_TOTAL_LENGTH,
} from '@/constants/components/auth/crew-code-verification-form-constant';

interface CrewCodeVerificationFormProps {
  onVerified: (orgName: string, orgId: string, orgCode: string) => void;
}

export default function CrewCodeVerificationForm({
  onVerified,
}: CrewCodeVerificationFormProps) {
  const [orgCode, setOrgCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify(e: React.SubmitEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyOrgCode(orgCode);
      if (result.valid) {
        const orgResult = await getOrgNameByCode(orgCode);
        if (orgResult.error || !orgResult.name) {
          setError(orgResult.error || crewCodeVerificationForm.orgResultError);
          return;
        }

        // Get org ID using RPC
        const supabase = createClient();
        const { data: id, error: idError } = await supabase.rpc(
          'get_org_id_by_code',
          { join_code_input: orgCode },
        );

        if (idError || !id) {
          setError(crewCodeVerificationForm.failedToLoadOrgId);
          return;
        }

        onVerified(orgResult.name, id, orgCode);
      } else {
        setError(crewCodeVerificationForm.invalidOrgCodeError);
      }
    } catch {
      setError(crewCodeVerificationForm.networkError);
    } finally {
      setIsLoading(false);
    }
  }

  function formatOrgCodeInput(input: string) {
    let value = input.replace(/[^A-HJ-NP-Z2-9]/gi, '').toUpperCase();
    if (value.length > CODE_TOTAL_LENGTH)
      value = value.slice(0, CODE_TOTAL_LENGTH);
    if (value.length > CODE_LENGTH_BEFORE_DASH)
      value =
        value.slice(0, CODE_LENGTH_BEFORE_DASH) +
        '-' +
        value.slice(CODE_LENGTH_BEFORE_DASH);
    return value;
  }

  return (
    <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-500">
      {/* Brand/Logo Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {crewCodeVerificationForm.joinCrew}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {crewCodeVerificationForm.joinCrewDescription}
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {crewCodeVerificationForm.securityCheckTitle}
          </CardTitle>
          <CardDescription>
            {crewCodeVerificationForm.securityCheckDescription}
          </CardDescription>
        </CardHeader>

        {/* Subtle Divider */}
        <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

        <CardContent className="pt-6">
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="org_code"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {crewCodeVerificationForm.orgCodeLabel}
              </Label>
              <Input
                id="org_code"
                placeholder="XXXX-XXXX"
                value={orgCode}
                onChange={(e) => setOrgCode(formatOrgCodeInput(e.target.value))}
                className="h-12 text-center font-mono text-xl tracking-[0.3em] uppercase bg-slate-50 dark:bg-slate-950 focus-visible:ring-primary/30"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold transition-all active:scale-[0.98]"
              disabled={isLoading || !orgCode.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                crewCodeVerificationForm.buttonLabel
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        {crewCodeVerificationForm.footerNeedHelp}{' '}
        <a
          href="/contact"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          {crewCodeVerificationForm.contactSupport}
        </a>
      </footer>
    </div>
  );
}
