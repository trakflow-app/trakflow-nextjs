'use client';

import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster component for rendering toast notifications app-wide.
 * Mount once in the root layout.
 */
function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} />;
}

export { Toaster };
