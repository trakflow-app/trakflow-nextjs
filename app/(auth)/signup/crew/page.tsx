'use client';
import { useState } from 'react';
import SignupForm from '@/components/auth/signup-form';
import { verifyOrgCode } from '@/lib/auth/actions';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Users } from 'lucide-react';

export default function CrewCodeVerificationPage() {
  const [orgCode, setOrgCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyOrgCode(orgCode);
      if (result.valid) {
        setVerified(true);
      } else {
        setError('Invalid organization code. Please check and try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-sm">
          <div className="text-center flex flex-col items-center">
            <h1 className="text-3xl font-bold">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600">Create your crew account</p>
          </div>
          <SignupForm orgCode={orgCode} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join as Crew</h1>
          <p className="text-muted-foreground">
            Enter your organization code to get started
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Verification Required
            </CardTitle>
            <CardDescription>
              This ensures youre joining the right organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_code">Organization Code</Label>
                <Input
                  id="org_code"
                  name="org_code"
                  type="text"
                  placeholder="Enter your code"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  required
                  disabled={isLoading}
                  className="font-mono text-lg tracking-wider"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full flex flex-row items-center justify-center gap-2"
                size="lg"
                disabled={isLoading || !orgCode.trim()}
              >
                {isLoading ? (
                  <>
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Dont have an organization code?{' '}
          <a
            href="/contact"
            className="font-medium text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
