'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
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
import {
  TOOL_CONDITION_OPTIONS,
  TOOLS_MANAGEMENT,
  TOOL_STATUS_OPTIONS,
} from '@/constants/components/tools/tools-constants';
import type { ProjectRow } from '@/lib/dal/projects';
import { compressToolCatalogImage } from '@/lib/image-compression';
import { showToast } from '@/lib/toast';
import {
  TOOL_CREATE_TEXT,
  TOOLS_ACTION_TEXT,
  TOOLS_PAGE_TEXT,
} from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolProject = Pick<ProjectRow, 'id' | 'project_name'>;

const CREATE_TOOL_IMAGE_INPUT_ID = `${TOOLS_MANAGEMENT.FORM_KEYS.imageFile}-create`;

type ToolCreateButtonProps = {
  projects: ToolProject[];
};

/**
 * Header button and dialog for creating a new tool record.
 */
export function ToolCreateButton({ projects }: ToolCreateButtonProps) {
  /**
   * State management
   */
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [imageFileName, setImageFileName] = useState('');
  const [isPending, startTransition] = useTransition();

  /**
   * Builds project options for the create form assignment field.
   */
  const projectOptions = useMemo<SelectOption[]>(
    () => [
      {
        label: TOOLS_PAGE_TEXT.inventoryType,
        value: TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE,
      },
      ...projects.map((project) => ({
        label: project.project_name,
        value: project.id,
      })),
    ],
    [projects],
  );

  /**
   * Clears local upload state when the create dialog closes.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setImageFileName('');
    }

    setOpen(nextOpen);
  }

  /**
   * Tracks the selected tool image filename for display.
   */
  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFileName(event.target.files?.[0]?.name ?? '');
  }

  /**
   * Creates a new tool and refreshes the tools page on success.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        const preparedFormData = await prepareToolImageFormData(formData).catch(
          () => null,
        );

        if (!preparedFormData) {
          showToast(TOOLS_ACTION_TEXT.imageInvalid, 'error');
          return;
        }

        const result = await createToolAction(preparedFormData);

        if (result?.error) {
          showToast(result.error, 'error');
          return;
        }

        showToast(TOOLS_ACTION_TEXT.createSuccess, 'success');
        form.reset();
        setImageFileName('');
        setOpen(false);
        router.refresh();
      })();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.name}
            >
              <Input
                id={TOOLS_MANAGEMENT.FORM_KEYS.name}
                name={TOOLS_MANAGEMENT.FORM_KEYS.name}
                placeholder={TOOL_CREATE_TEXT.namePlaceholder}
                required
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.tagNumberLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.tagNumber}
            >
              <Input
                id={TOOLS_MANAGEMENT.FORM_KEYS.tagNumber}
                name={TOOLS_MANAGEMENT.FORM_KEYS.tagNumber}
                type="number"
                min={TOOLS_MANAGEMENT.LIMITS.MIN_TAG_NUMBER}
                placeholder={TOOL_CREATE_TEXT.tagNumberPlaceholder}
                required
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.projectLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
            >
              <SelectField
                id={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
                name={TOOLS_MANAGEMENT.FORM_KEYS.projectId}
                options={projectOptions}
                defaultValue={TOOLS_MANAGEMENT.FILTERS.INVENTORY_PROJECT_VALUE}
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.statusLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.status}
            >
              <SelectField
                id={TOOLS_MANAGEMENT.FORM_KEYS.status}
                name={TOOLS_MANAGEMENT.FORM_KEYS.status}
                options={TOOL_STATUS_OPTIONS}
                defaultValue={TOOLS_MANAGEMENT.DEFAULTS.TOOL_STATUS}
              />
            </ToolCreateFormField>
            <ToolCreateFormField
              label={TOOL_CREATE_TEXT.conditionLabel}
              htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.condition}
            >
              <SelectField
                id={TOOLS_MANAGEMENT.FORM_KEYS.condition}
                name={TOOLS_MANAGEMENT.FORM_KEYS.condition}
                options={TOOL_CONDITION_OPTIONS}
                defaultValue={TOOLS_MANAGEMENT.DEFAULTS.TOOL_CONDITION}
              />
            </ToolCreateFormField>
          </div>
          <ToolCreateFormField
            label={TOOL_CREATE_TEXT.imageAttachmentLabel}
            htmlFor={CREATE_TOOL_IMAGE_INPUT_ID}
          >
            <div className="flex flex-col gap-2">
              <Input
                id={CREATE_TOOL_IMAGE_INPUT_ID}
                name={TOOLS_MANAGEMENT.FORM_KEYS.imageFile}
                type="file"
                accept={TOOLS_MANAGEMENT.FILES.IMAGE_ACCEPT}
                className="sr-only"
                onChange={handleImageChange}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" asChild>
                  <label
                    htmlFor={CREATE_TOOL_IMAGE_INPUT_ID}
                    className="cursor-pointer"
                  >
                    <Upload data-icon="inline-start" />
                    {TOOL_CREATE_TEXT.imageAttachmentButton}
                  </label>
                </Button>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {imageFileName || TOOL_CREATE_TEXT.noImageSelected}
                </span>
              </div>
            </div>
          </ToolCreateFormField>
          <ToolCreateFormField
            label={TOOL_CREATE_TEXT.notesLabel}
            htmlFor={TOOLS_MANAGEMENT.FORM_KEYS.notes}
          >
            <Textarea
              id={TOOLS_MANAGEMENT.FORM_KEYS.notes}
              name={TOOLS_MANAGEMENT.FORM_KEYS.notes}
              placeholder={TOOL_CREATE_TEXT.notesPlaceholder}
            />
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

/**
 * Compresses the optional tool image before submitting the server action.
 */
async function prepareToolImageFormData(formData: FormData): Promise<FormData> {
  const imageFile = formData.get(TOOLS_MANAGEMENT.FORM_KEYS.imageFile);

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return formData;
  }

  const compressedImage = await compressToolCatalogImage(imageFile);
  formData.set(TOOLS_MANAGEMENT.FORM_KEYS.imageFile, compressedImage);

  return formData;
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
