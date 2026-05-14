import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { createMaterialAction } from '@/app/services/materials-services';


interface MaterialsAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string | null;
    onSubmitSuccess?: () => void;
}

type AddMaterialFormData = {
    name: string;
    projectId: string;
    quantity: number;
    unitCost: number;
    lowStockThreshold: number;
};

export function MaterialsAddModal({
    isOpen,
    onClose,
    orgId,
    onSubmitSuccess,
}: MaterialsAddModalProps) {
    const canCreateMaterial = !!orgId;
    const [formData, setFormData] = useState<AddMaterialFormData>({
        name: '',
        projectId: '',
        quantity: 0,
        unitCost: 0,
        lowStockThreshold: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleInputChange = (
        field: keyof AddMaterialFormData,
        value: string | number,
    ) => {
        setFormData((currentFormData) => ({
            ...currentFormData,
            [field]: value,
        }));
    }

    const handleSubmit = async () => {
        if (!orgId) return;

        setError(null);
        setIsSubmitting(true);

        try {
            await createMaterialAction({
                orgId,
                name: formData.name,
                projectId: formData.projectId || null,
                quantity: formData.quantity,
                unitCost: formData.unitCost,
                lowStockThreshold: formData.lowStockThreshold,
            });
            onSubmitSuccess?.();
            onClose();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to create material';

            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Material</DialogTitle>
                    <DialogDescription>
                        {canCreateMaterial ? (
                            <>
                                {error && (
                                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 mb-4">
                                    <label htmlFor='material-name'>Material Name</label>
                                    <Input
                                        id="material-name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Concrete, lumber, screws..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="material-quantity">Quantity</label>
                                        <Input
                                            id="material-quantity"
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) =>
                                                handleInputChange('quantity', Number(e.target.value))
                                            }
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="material-unit-cost">Unit Cost</label>
                                        <Input
                                            id="material-unit-cost"
                                            type="number"
                                            value={formData.unitCost}
                                            onChange={(e) =>
                                                handleInputChange('unitCost', Number(e.target.value))
                                            }
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="material-low-stock">Low Stock</label>
                                        <Input
                                            id="material-low-stock"
                                            type="number"
                                            value={formData.lowStockThreshold}
                                            onChange={(e) =>
                                                handleInputChange('lowStockThreshold', Number(e.target.value))
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? 'Adding...' : 'Add Material'}
                                    </Button>
                                </div>

                            </>
                        ) : (
                            <div>
                                Loading organization information... Please wait.
                            </div>
                        )}

                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}