'use client';

import { type FormEvent, useState, useTransition } from 'react';
import {
  createProjectAction,
  updateProjectAction,
} from '@/app/services/projects-services';
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
import { SelectField } from '@/components/ui/select-field';
import {
  PROJECTS_MANAGEMENT,
  PROJECT_STATUS_OPTIONS,
} from '@/constants/components/projects/projects-constants';
import {
  PROJECTS_ACTION_TEXT,
  PROJECTS_FORM_TEXT,
} from '@/locales/app/(dashboard)/projects/projects-page-locales';
import type { ProjectManagerRow } from '@/lib/dal/projects';
import type { Database } from '@/lib/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];

/**
 * Controls whether the project dialog creates a new row or edits an existing row.
 */
export type ProjectDialogMode = 'create' | 'edit';

type ProjectFormState = {
  budgetAmount: string;
  endDate: string;
  name: string;
  startDate: string;
  status: ProjectStatus;
};

type ProjectFormDialogProps = {
  mode: ProjectDialogMode;
  onClose: () => void;
  onProjectCreated: (project: ProjectManagerRow) => void;
  onProjectUpdated: (project: ProjectManagerRow) => void;
  open: boolean;
  project: ProjectManagerRow | null;
};

type ProjectFormFieldsProps = ProjectFormDialogProps & {
  isPending: boolean;
  isEditMode: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
};

function getInitialProjectFormState(
  project?: ProjectManagerRow | null,
): ProjectFormState {
  return {
    budgetAmount: project?.budget_amount ? String(project.budget_amount) : '',
    endDate: project?.end_date ?? '',
    name: project?.project_name ?? '',
    startDate: project?.start_date ?? '',
    status: project?.status ?? 'ACTIVE',
  };
}

/**
 * Renders the create/edit project dialog and submits project mutations.
 */
export function ProjectFormDialog({
  mode,
  onClose,
  onProjectCreated,
  onProjectUpdated,
  open,
  project,
}: ProjectFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = mode === 'edit';
  const formInstanceKey = `${mode}-${project?.id ?? PROJECTS_MANAGEMENT.FILTERS.ALL}-${String(open)}`;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? PROJECTS_ACTION_TEXT.editTitle
              : PROJECTS_ACTION_TEXT.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? PROJECTS_ACTION_TEXT.editDescription
              : PROJECTS_ACTION_TEXT.createDescription}
          </DialogDescription>
        </DialogHeader>

        <ProjectFormFields
          key={formInstanceKey}
          mode={mode}
          onClose={onClose}
          onProjectCreated={onProjectCreated}
          onProjectUpdated={onProjectUpdated}
          open={open}
          project={project}
          isPending={isPending}
          isEditMode={isEditMode}
          startTransition={startTransition}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders the controlled form fields for one dialog session.
 */
function ProjectFormFields({
  isPending,
  isEditMode,
  onClose,
  onProjectCreated,
  onProjectUpdated,
  project,
  startTransition,
}: ProjectFormFieldsProps) {
  const [formState, setFormState] = useState<ProjectFormState>(() =>
    getInitialProjectFormState(project),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  function updateFormField<Field extends keyof ProjectFormState>(
    field: Field,
    value: ProjectFormState[Field],
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        // Edit submits include a hidden project id; create submits do not.
        const result =
          isEditMode && project
            ? await updateProjectAction(formData)
            : await createProjectAction(formData);

        if (result.error || !result.project) {
          const nextError = result.error ?? PROJECTS_ACTION_TEXT.saveFailed;

          setLocalError(nextError);
          return;
        }

        if (isEditMode) {
          onProjectUpdated(result.project);
        } else {
          onProjectCreated(result.project);
          setFormState(getInitialProjectFormState());
        }

        onClose();
      })();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {project && (
        <input
          type="hidden"
          name={PROJECTS_MANAGEMENT.FORM_KEYS.id}
          value={project.id}
        />
      )}

      {localError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {localError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="project-name" className="text-sm font-medium">
          {PROJECTS_FORM_TEXT.nameLabel}
        </label>
        <Input
          id="project-name"
          name={PROJECTS_MANAGEMENT.FORM_KEYS.name}
          onChange={(event) => updateFormField('name', event.target.value)}
          placeholder={PROJECTS_FORM_TEXT.namePlaceholder}
          required
          value={formState.name}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="project-start-date" className="text-sm font-medium">
            {PROJECTS_FORM_TEXT.startDateLabel}
          </label>
          <Input
            id="project-start-date"
            name={PROJECTS_MANAGEMENT.FORM_KEYS.startDate}
            onChange={(event) =>
              updateFormField('startDate', event.target.value)
            }
            required
            type="date"
            value={formState.startDate}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="project-end-date" className="text-sm font-medium">
            {PROJECTS_FORM_TEXT.endDateLabel}
          </label>
          <Input
            id="project-end-date"
            name={PROJECTS_MANAGEMENT.FORM_KEYS.endDate}
            onChange={(event) => updateFormField('endDate', event.target.value)}
            type="date"
            value={formState.endDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="project-status" className="text-sm font-medium">
            {PROJECTS_FORM_TEXT.statusLabel}
          </label>
          <SelectField
            id="project-status"
            name={PROJECTS_MANAGEMENT.FORM_KEYS.status}
            onChange={(value) =>
              updateFormField('status', value as ProjectStatus)
            }
            options={PROJECT_STATUS_OPTIONS}
            value={formState.status}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="project-budget" className="text-sm font-medium">
            {PROJECTS_FORM_TEXT.budgetLabel}
          </label>
          <Input
            id="project-budget"
            min="0"
            name={PROJECTS_MANAGEMENT.FORM_KEYS.budgetAmount}
            onChange={(event) =>
              updateFormField('budgetAmount', event.target.value)
            }
            placeholder={PROJECTS_FORM_TEXT.budgetPlaceholder}
            step="0.01"
            type="number"
            value={formState.budgetAmount}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          {PROJECTS_ACTION_TEXT.cancel}
        </Button>
        <Button type="submit" isLoading={isPending}>
          {PROJECTS_ACTION_TEXT.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
