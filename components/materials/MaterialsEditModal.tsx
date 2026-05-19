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
import { updateMaterialAction } from '@/app/services/materials-services'; // You will create this next
import { EditMaterialFormOutput } from '@/lib/validations/materials-validations';
import { type MaterialUI } from '@/lib/dal/materials';

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

  /**
   * Handle form submission
   * Sends updated data to the backend and manages UI state.
   */
  const handleSubmit: SubmitHandler<EditMaterialFormOutput> = async (data) => {
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
        err instanceof Error ? err.message : 'Failed to update material.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            {material
              ? `Update the details for ${material.name}.`
              : 'Loading material details...'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="mt-4">
          {material ? (
            <MaterialEditForm
              material={material}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
