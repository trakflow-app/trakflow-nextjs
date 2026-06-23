'use client';

import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { createMaterialAction } from '@/app/services/materials-services';
import { materialsAddModalLocales } from '@/locales/components/materials/materials-add-modal-locales';
import { MATERIAL_ADD_FORM } from '@/constants/components/materials/form';
import { type ProjectOption } from '@/lib/dal/projects';

interface MaterialsAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string | null;
  projects: ProjectOption[];
  onSubmitSuccess?: () => Promise<void> | void;
}

type AddMaterialFormData = {
  name: string;
  projectId: string | null;
  quantity: number;
  unitCost: number;
  lowStockThreshold: number;
};

const ORG_INVENTORY_PROJECT_VALUE = '__org_inventory__';

const addMaterialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, materialsAddModalLocales.validation.nameRequired),
  projectId: z.string().nullable(),
  quantity: z.coerce
    .number()
    .min(0, materialsAddModalLocales.validation.quantityMinimum),
  unitCost: z.coerce
    .number()
    .positive(materialsAddModalLocales.validation.unitCostRequired),
  lowStockThreshold: z.coerce
    .number()
    .min(0, materialsAddModalLocales.validation.lowStockMinimum),
});

const INITIAL_FORM_DATA: AddMaterialFormData = {
  name: '',
  projectId: null,
  quantity: 0,
  unitCost: 0,
  lowStockThreshold: 0,
};

/**
 * Displays the dialog for adding a new material inventory item.
 */
export function MaterialsAddModal({
  isOpen,
  onClose,
  orgId,
  projects,
  onSubmitSuccess,
}: MaterialsAddModalProps) {
  const canCreateMaterial = Boolean(orgId);
  const [formData, setFormData] =
    useState<AddMaterialFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectOptions: SelectOption[] = [
    {
      label: materialsAddModalLocales.orgInventoryOption,
      value: ORG_INVENTORY_PROJECT_VALUE,
    },
    ...projects.map((project) => ({
      label: project.name,
      value: project.id,
    })),
  ];

  function handleOpenChange(open: boolean) {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      onClose();
    }
  }

  const handleInputChange = (
    field: keyof AddMaterialFormData,
    value: string | number | null,
  ) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) return;

    const validationResult = addMaterialSchema.safeParse(formData);

    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createMaterialAction({
        orgId,
        name: validationResult.data.name,
        projectId: validationResult.data.projectId,
        quantity: validationResult.data.quantity,
        unitCost: validationResult.data.unitCost,
        lowStockThreshold: validationResult.data.lowStockThreshold,
      });
      await onSubmitSuccess?.();
      setFormData(INITIAL_FORM_DATA);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : materialsAddModalLocales.createFailed;

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{materialsAddModalLocales.title}</DialogTitle>
          <DialogDescription>
            {materialsAddModalLocales.description}
          </DialogDescription>
        </DialogHeader>

        {canCreateMaterial ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="material-name">
                {materialsAddModalLocales.materialNameLabel}
              </label>
              <Input
                id="material-name"
                value={formData.name}
                onChange={(event) =>
                  handleInputChange('name', event.target.value)
                }
                placeholder={materialsAddModalLocales.materialNamePlaceholder}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="material-project">
                {materialsAddModalLocales.projectLabel}
              </label>
              <SelectField
                id="material-project"
                options={projectOptions}
                value={formData.projectId ?? ORG_INVENTORY_PROJECT_VALUE}
                onChange={(value) =>
                  handleInputChange(
                    'projectId',
                    value === ORG_INVENTORY_PROJECT_VALUE ? null : value,
                  )
                }
                placeholder={materialsAddModalLocales.projectPlaceholder}
                disabled={isSubmitting}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="material-quantity">
                  {materialsAddModalLocales.quantityLabel}
                </label>
                <Input
                  id="material-quantity"
                  type={MATERIAL_ADD_FORM.INPUT.TYPE}
                  step={MATERIAL_ADD_FORM.INPUT.STEP}
                  value={formData.quantity}
                  onChange={(event) =>
                    handleInputChange('quantity', Number(event.target.value))
                  }
                  placeholder={materialsAddModalLocales.numberPlaceholder}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="material-unit-cost">
                  {materialsAddModalLocales.unitCostLabel}
                </label>
                <Input
                  id="material-unit-cost"
                  type={MATERIAL_ADD_FORM.INPUT.TYPE}
                  step={MATERIAL_ADD_FORM.INPUT.STEP}
                  value={formData.unitCost}
                  onChange={(event) =>
                    handleInputChange('unitCost', Number(event.target.value))
                  }
                  placeholder={materialsAddModalLocales.numberPlaceholder}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="material-low-stock">
                  {materialsAddModalLocales.lowStockLabel}
                </label>
                <Input
                  id="material-low-stock"
                  type={MATERIAL_ADD_FORM.INPUT.TYPE}
                  step={MATERIAL_ADD_FORM.INPUT.STEP}
                  value={formData.lowStockThreshold}
                  onChange={(event) =>
                    handleInputChange(
                      'lowStockThreshold',
                      Number(event.target.value),
                    )
                  }
                  placeholder={materialsAddModalLocales.numberPlaceholder}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting}>
                {materialsAddModalLocales.submitButton}
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-4 text-sm text-muted-foreground">
            {materialsAddModalLocales.loadingOrg}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
