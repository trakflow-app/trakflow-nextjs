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
}

export function MaterialsAddModal({ isOpen, onClose }: MaterialsAddModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Material</DialogTitle>
                    <DialogDescription>
                        Create a new material inventory item.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}