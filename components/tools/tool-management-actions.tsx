'use client';

import { useState, useTransition } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut } from 'lucide-react';
import {
  checkinToolAction,
  checkoutToolsAction,
  type ToolManagementState,
} from '@/app/services/tools-management-services';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import {
  TOOL_CHECKOUT_CONDITION_OPTIONS,
  TOOL_CONDITION_OPTIONS,
  TOOLS_MANAGEMENT,
} from '@/constants/components/tools/tools-constants';
import type { ToolCondition, ToolRow } from '@/lib/dal/tools';
import { showToast } from '@/lib/toast';
import {
  TOOL_CHECKIN_TEXT,
  TOOL_CHECKOUT_TEXT,
  TOOLS_ACTION_TEXT,
  TOOLS_CARD_TEXT,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolManagementActionsProps = {
  tool: ToolRow;
  toolManagementState?: ToolManagementState;
};

const TOOL_ACTION_BUTTON_CLASS =
  'hover:border-primary hover:bg-primary hover:text-primary-foreground';

/**
 * Renders checkout and check-in actions for a single tool.
 */
export function ToolManagementActions({
  tool,
  toolManagementState,
}: ToolManagementActionsProps) {
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canCheckout = tool.status === 'AVAILABLE';
  const canCheckin = tool.status === 'CHECKEDOUT';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canCheckout ? (
          <Button
            type="button"
            variant="outline"
            className={TOOL_ACTION_BUTTON_CLASS}
            onClick={() => setCheckoutOpen(true)}
          >
            <LogOut data-icon="inline-start" />
            {TOOLS_CARD_TEXT.checkoutAction}
          </Button>
        ) : null}
        {canCheckin ? (
          <Button
            type="button"
            variant="outline"
            className={TOOL_ACTION_BUTTON_CLASS}
            onClick={() => setCheckinOpen(true)}
          >
            <LogIn data-icon="inline-start" />
            {TOOLS_CARD_TEXT.checkinAction}
          </Button>
        ) : null}
      </div>

      <ToolCheckoutDialog
        tool={tool}
        open={checkoutOpen}
        isPending={isPending}
        onOpenChange={setCheckoutOpen}
        onSuccess={() => {
          setCheckoutOpen(false);
          router.refresh();
        }}
        startTransition={startTransition}
      />
      <ToolCheckinDialog
        tool={tool}
        toolManagementState={toolManagementState}
        open={checkinOpen}
        isPending={isPending}
        onOpenChange={setCheckinOpen}
        onSuccess={() => {
          setCheckinOpen(false);
          router.refresh();
        }}
        startTransition={startTransition}
      />
    </>
  );
}

type ToolCheckoutDialogProps = {
  tool: ToolRow;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  startTransition: (callback: () => void) => void;
};

function ToolCheckoutDialog({
  tool,
  open,
  isPending,
  onOpenChange,
  onSuccess,
  startTransition,
}: ToolCheckoutDialogProps) {
  const defaultCheckoutCondition =
    tool.condition !== 'OUT_OF_SERVICE'
      ? tool.condition
      : TOOLS_MANAGEMENT.DEFAULTS.TOOL_CONDITION;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set(TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolId, tool.id);

    startTransition(() => {
      void (async () => {
        const result = await checkoutToolsAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.checkoutSuccess, 'success');
        onSuccess();
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_CHECKOUT_TEXT.title}</DialogTitle>
          <DialogDescription>
            {TOOL_CHECKOUT_TEXT.description}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <ToolActionField
            label={TOOL_CHECKOUT_TEXT.conditionLabel}
            htmlFor={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
          >
            <SelectField
              id={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
              name={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
              options={TOOL_CHECKOUT_CONDITION_OPTIONS}
              defaultValue={defaultCheckoutCondition}
            />
          </ToolActionField>
          <ToolActionField
            label={TOOL_CHECKOUT_TEXT.sessionNameLabel}
            htmlFor={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.sessionName}
          >
            <Input
              id={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.sessionName}
              name={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.sessionName}
              placeholder={TOOL_CHECKOUT_TEXT.sessionNamePlaceholder}
            />
          </ToolActionField>
          <ToolActionField
            label={TOOL_CHECKOUT_TEXT.notesLabel}
            htmlFor={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
          >
            <Textarea
              id={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
              name={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
              placeholder={TOOL_CHECKOUT_TEXT.notesPlaceholder}
            />
          </ToolActionField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {TOOL_CHECKOUT_TEXT.cancelButton}
            </Button>
            <Button type="submit" disabled={isPending}>
              <LogOut data-icon="inline-start" />
              {TOOL_CHECKOUT_TEXT.confirmButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ToolCheckinDialogProps = {
  tool: ToolRow;
  toolManagementState?: ToolManagementState;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  startTransition: (callback: () => void) => void;
};

function ToolCheckinDialog({
  tool,
  toolManagementState,
  open,
  isPending,
  onOpenChange,
  onSuccess,
  startTransition,
}: ToolCheckinDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set(TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolId, tool.id);

    if (toolManagementState?.activeCheckoutId) {
      formData.set(
        TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.toolManagementId,
        toolManagementState.activeCheckoutId,
      );
    }

    startTransition(() => {
      void (async () => {
        const result = await checkinToolAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.checkinSuccess, 'success');
        onSuccess();
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_CHECKIN_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_CHECKIN_TEXT.description}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <ToolActionField
            label={TOOL_CHECKIN_TEXT.conditionLabel}
            htmlFor={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
          >
            <SelectField
              id={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
              name={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.condition}
              options={TOOL_CONDITION_OPTIONS}
              defaultValue={tool.condition as ToolCondition}
            />
          </ToolActionField>
          <ToolActionField
            label={TOOL_CHECKIN_TEXT.notesLabel}
            htmlFor={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
          >
            <Textarea
              id={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
              name={TOOLS_MANAGEMENT.MANAGEMENT_FORM_KEYS.notes}
              placeholder={TOOL_CHECKIN_TEXT.notesPlaceholder}
            />
          </ToolActionField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {TOOL_CHECKIN_TEXT.cancelButton}
            </Button>
            <Button type="submit" disabled={isPending}>
              <LogIn data-icon="inline-start" />
              {TOOL_CHECKIN_TEXT.confirmButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ToolActionFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function ToolActionField({ label, htmlFor, children }: ToolActionFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
