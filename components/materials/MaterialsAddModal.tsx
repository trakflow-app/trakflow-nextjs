import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface MaterialsAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string | null;
}
type AddMaterialFormData = {
    name: string;
    projectId: string;
    quantity: number;
    unitCost: number;
    lowStockThreshold: number;
};

export function MaterialsAddModal({ isOpen, onClose, orgId }: MaterialsAddModalProps) {
    const canCreateMaterial = !!orgId;
    const [formData, setFormData] = useState<AddMaterialFormData>({
        name: '',
        projectId: '',
        quantity: 0,
        unitCost: 0,
        lowStockThreshold: 0,
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Material</DialogTitle>
                    <DialogDescription>
                        {canCreateMaterial ? (
                            <div>
                                Form goes here
                            </div>
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