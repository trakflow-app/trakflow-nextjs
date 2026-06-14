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
import { MaterialUsageForm } from './MaterialUsageForm';
import { logMaterialUsageAction } from '@/app/services/materials-services';
import { MaterialUsageSubmitData } from '@/lib/types/materials-types';
import { materialUsageModalLocales } from '@/locales/components/materials/materials-usage-modal-locales';
import { type MaterialUI } from '@/lib/types/materials-types';
interface MaterialUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string | null;
  materials: MaterialUI[];
  projects: Array<{ id: string; name: string }>;
  onSubmitSuccess?: (data: MaterialUsageSubmitData) => void;
}

/**
 * MaterialUsageModal Component
 * Displays a dialog for logging material consumption.
 * Manages modal state, material data lookup, and form submission.
 */
export function MaterialUsageModal({
  isOpen,
  onClose,
  materialId,
  materials,
  projects,
  onSubmitSuccess,
}: MaterialUsageModalProps) {
  /**
   * State Management
   */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the selected material
  const selectedMaterial = materialId
    ? materials.find((m) => m.id === materialId)
    : null;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  /**
   * Handle form submission
   * Validates data, sends to backend, and manages UI state
   */
  const handleSubmit: SubmitHandler<MaterialUsageSubmitData> = async (data) => {
    // Guard for making sure materials ID is not empty
    if (!materialId) {
      setError(materialUsageModalLocales.noMaterialSelected);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await logMaterialUsageAction({
        materialId: data.materialId,
        projectId: data.projectId,
        quantityUsed: data.quantityUsed,
        notes: data.notes || undefined,
      });
      // Call success callback if provided
      onSubmitSuccess?.(data);

      // Close modal after successful submission
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : materialUsageModalLocales.failedToLogUsage;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{materialUsageModalLocales.title}</DialogTitle>
          <DialogDescription>
            {selectedMaterial
              ? materialUsageModalLocales.descriptionWithMaterial(
                  selectedMaterial.name,
                )
              : materialUsageModalLocales.descriptionDefault}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="mt-6">
          {/* If selectedMaterial is null, show a loading state or nothing at all */}
          {selectedMaterial ? (
            <MaterialUsageForm
              materialId={materialId!}
              projectName={selectedMaterial.projectName}
              currentQuantity={selectedMaterial.quantity}
              defaultProjectId={selectedMaterial.projectId}
              projectOptions={projects}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {materialUsageModalLocales.loading}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
