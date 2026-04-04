'use client';

import * as React from 'react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TOAST_DURATION = 5000;
const TOAST_CLOSE_LABEL = 'Close';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 pr-10 shadow-md transition-all data-open:animate-in data-open:slide-in-from-bottom-2 data-open:fade-in-0 data-closed:animate-out data-closed:slide-out-to-right-full data-closed:fade-out-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        success:
          'border-success/30 bg-success/10 text-success dark:border-success/50',
        error:
          'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Provides the Toast context and renders the Viewport.
 * Mount this once in the root layout, wrapping {children}.
 */
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'fixed right-0 bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for the ToastNotification component.
 */
interface ToastNotificationProps extends VariantProps<typeof toastVariants> {
  /** The message to display in the toast */
  message: string;
  /** Whether the toast is visible */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Auto dismiss delay in milliseconds */
  duration?: number;
}

/**
 * Reusable toast notification for success and error messages.
 * Requires ToastProvider to be present in the layout.
 */
function ToastNotification({
  message,
  variant = 'default',
  open,
  onOpenChange,
  duration = TOAST_DURATION,
}: ToastNotificationProps) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={cn(toastVariants({ variant }))}
    >
      <ToastPrimitive.Title
        data-slot="toast-title"
        className="text-sm font-medium"
      >
        {message}
      </ToastPrimitive.Title>
      <ToastPrimitive.Close data-slot="toast-close" asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-1 opacity-60 hover:opacity-100"
        >
          <XIcon />
          <span className="sr-only">{TOAST_CLOSE_LABEL}</span>
        </Button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export { ToastProvider, ToastViewport, ToastNotification, TOAST_DURATION };
