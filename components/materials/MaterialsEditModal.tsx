'use client';

import { useEffect, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MaterialEditForm } from '@/components/materials/MaterialsEditForm';
import { type MaterialUI } from '@/lib/types/materials-types';
import { EditMaterialFormInput } from '@/lib/validations/materials-validations';
import { updateMaterialAction } from '@/app/services/materials-services';
import { materialEditModalLocales } from '@/locales/components/materials/materials-edit-modal-locales';

interface MaterialEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialUI | null;
  onSubmitSuccess?: (updatedMaterial: MaterialUI) => void;
}

/**
 * MaterialEditModal Component
 * Displays a dialog for editing an existing material.
 */
export function MaterialEditModal({
  isOpen,
  onClose,
  material,
  onSubmitSuccess,
}: MaterialEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  function handleOpenChange(open: boolean) {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      onClose();
    }
  }

  /**
   * Handle form submission
   * Sends updated data to the backend and manages UI state.
   */
  const handleSubmit: SubmitHandler<EditMaterialFormInput> = async (data) => {
    if (!material) {
      setError('No material selected for editing.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // This is the server action you'll create next
      const updatedMaterial = await updateMaterialAction({
        id: material.id,
        ...data,
      });

      // Pass the updated material back up to the parent page
      if (onSubmitSuccess) {
        onSubmitSuccess(updatedMaterial);
      }

      onClose(); // Close modal on success
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : materialEditModalLocales.failedToEditMaterial;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{materialEditModalLocales.title}</DialogTitle>
          <DialogDescription>
            {material
              ? materialEditModalLocales.descriptionWithMaterial(material.name)
              : materialEditModalLocales.loading}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div>
          {material ? (
            <MaterialEditForm
              material={material}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {materialEditModalLocales.loading}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
