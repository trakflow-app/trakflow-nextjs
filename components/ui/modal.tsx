'use client';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LoadingScreen from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

/**
 * Reusable modal props
 */
interface ReusableModalProps {
  title: string;
  description?: string;
  /** Modal body/content */
  children: React.ReactNode;
  /** Action buttons */
  footer?: React.ReactNode;
  /** Visibility */
  open: boolean;
  /** Decisions */
  onOpenChange: (open: boolean) => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * This is a reusable modal component that will be trigger when some actions is being executed
 * such as create, edit and delete
 */
export function ReusableModal({
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  isLoading,
}: ReusableModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Main Content Area */}
        <div className="relative py-4 min-h-[100px]">
          {/* Overlay your reusable loading state */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <LoadingScreen />
            </div>
          )}

          {/* Blur or dim content while loading */}
          <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            {children}
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter>
          {/* If you pass custom buttons via footer prop, they go here */}
          {footer ? (
            footer
          ) : (
            <Button disabled={isLoading} onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
