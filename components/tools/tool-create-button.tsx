'use client';

import { useMemo, useState, useTransition } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createToolAction } from '@/app/services/tools-services';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectRow } from '@/lib/dal/projects';
import { showToast } from '@/lib/toast';
import type { Database } from '@/lib/types/database.types';
import {
  TOOL_CONDITION_LABELS,
  TOOL_CREATE_TEXT,
  TOOLS_ACTION_TEXT,
  TOOLS_PAGE_TEXT,
  TOOL_STATUS_LABELS,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];
type ToolProject = Pick<ProjectRow, 'id' | 'project_name'>;

type ToolCreateButtonProps = {
  projects: ToolProject[];
};

const DEFAULT_TOOL_STATUS: ToolStatus = 'AVAILABLE';
const DEFAULT_TOOL_CONDITION: ToolCondition = 'GOOD';
const INVENTORY_PROJECT_VALUE = 'inventory';
const MIN_TAG_NUMBER = 1;
const TOOL_FORM_KEYS = {
  name: 'name',
  tagNumber: 'tagNumber',
  status: 'status',
  condition: 'condition',
  projectId: 'projectId',
  notes: 'notes',
} as const;

const STATUS_OPTIONS: SelectOption[] = Object.entries(TOOL_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const CONDITION_OPTIONS: SelectOption[] = Object.entries(
  TOOL_CONDITION_LABELS,
).map(([value, label]) => ({ value, label }));

/**
 * Header button and dialog for creating a new tool record.
 */
export function ToolCreateButton({ projects }: ToolCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const projectOptions = useMemo<SelectOption[]>(
    () => [
      { label: TOOLS_PAGE_TEXT.inventoryType, value: INVENTORY_PROJECT_VALUE },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        const result = await createToolAction(formData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.createSuccess, 'success');
        form.reset();
        setOpen(false);
        router.refresh();
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          {TOOLS_PAGE_TEXT.addToolButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TOOL_CREATE_TEXT.title}</DialogTitle>
          <DialogDescription>{TOOL_CREATE_TEXT.description}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.nameLabel}
              htmlFor={TOOL_FORM_KEYS.name}
            >
              <Input
                id={TOOL_FORM_KEYS.name}
                name={TOOL_FORM_KEYS.name}
                required
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.tagNumberLabel}
              htmlFor={TOOL_FORM_KEYS.tagNumber}
            >
              <Input
                id={TOOL_FORM_KEYS.tagNumber}
                name={TOOL_FORM_KEYS.tagNumber}
                type="number"
                min={MIN_TAG_NUMBER}
                required
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.projectLabel}
              htmlFor={TOOL_FORM_KEYS.projectId}
            >
              <SelectField
                id={TOOL_FORM_KEYS.projectId}
                name={TOOL_FORM_KEYS.projectId}
                options={projectOptions}
                defaultValue={INVENTORY_PROJECT_VALUE}
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.statusLabel}
              htmlFor={TOOL_FORM_KEYS.status}
            >
              <SelectField
                id={TOOL_FORM_KEYS.status}
                name={TOOL_FORM_KEYS.status}
                options={STATUS_OPTIONS}
                defaultValue={DEFAULT_TOOL_STATUS}
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.conditionLabel}
              htmlFor={TOOL_FORM_KEYS.condition}
            >
              <SelectField
                id={TOOL_FORM_KEYS.condition}
                name={TOOL_FORM_KEYS.condition}
                options={CONDITION_OPTIONS}
                defaultValue={DEFAULT_TOOL_CONDITION}
              />
            </ToolCreateFormField>
          </div>
          <ToolCreateFormField
            label={TOOL_CREATE_TEXT.notesLabel}
            htmlFor={TOOL_FORM_KEYS.notes}
          >
            <Textarea id={TOOL_FORM_KEYS.notes} name={TOOL_FORM_KEYS.notes} />
          </ToolCreateFormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {TOOL_CREATE_TEXT.cancelButton}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {TOOL_CREATE_TEXT.createButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ToolCreateFormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

function ToolCreateFormField({
  label,
  htmlFor,
  children,
}: ToolCreateFormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
