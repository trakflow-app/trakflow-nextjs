'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CREW_CODE_COPY_RESET_DELAY_MS } from '@/constants/components/dashboard/dashboard-constants';
import { DASHBOARD_TEXT } from '@/locales/components/dashboard/dashboard-locales';

type CrewCodeCardProps = {
  joinCode: string | null;
};

/**
 * Displays the organization join code behind an intentional reveal/copy flow.
 */
export function CrewCodeCard({ joinCode }: CrewCodeCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const canCopyCode = Boolean(joinCode && isRevealed);

  function handleCopyCode() {
    if (!joinCode) return;

    navigator.clipboard.writeText(joinCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), CREW_CODE_COPY_RESET_DELAY_MS);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {DASHBOARD_TEXT.crewManagement.shareCodeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {DASHBOARD_TEXT.crewManagement.shareCodeDescription}
        </p>
        <Alert>
          <AlertDescription>
            {DASHBOARD_TEXT.crewManagement.shareCodeGuidance}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <code className="min-h-8 font-mono text-lg tracking-widest">
            {joinCode
              ? isRevealed
                ? joinCode
                : DASHBOARD_TEXT.crewManagement.hiddenCode
              : DASHBOARD_TEXT.crewManagement.noCode}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRevealed((currentValue) => !currentValue);
                setIsCopied(false);
              }}
              disabled={!joinCode}
            >
              {isRevealed ? (
                <EyeOff aria-hidden="true" data-icon="inline-start" />
              ) : (
                <Eye aria-hidden="true" data-icon="inline-start" />
              )}
              {isRevealed
                ? DASHBOARD_TEXT.crewManagement.hideCodeButton
                : DASHBOARD_TEXT.crewManagement.revealCodeButton}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopyCode}
              disabled={!canCopyCode}
            >
              <Copy aria-hidden="true" data-icon="inline-start" />
              {isCopied
                ? DASHBOARD_TEXT.crewManagement.codeCopiedButton
                : DASHBOARD_TEXT.crewManagement.copyCodeButton}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
