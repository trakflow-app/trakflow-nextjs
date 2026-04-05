'use client';

import { toast } from 'sonner';

const TOAST_DURATION = 5000;

/**
 * Shows a toast notification with success or error styling.
 */
function showToast(message: string, variant: 'success' | 'error') {
  if (variant === 'success') {
    toast.success(message, { duration: TOAST_DURATION });
  } else {
    toast.error(message, { duration: TOAST_DURATION });
  }
}

export { showToast, TOAST_DURATION };
