import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const AVATAR_IMAGE_ALT = 'User avatar';
const AVATAR_FALLBACK_TEXT = 'U';
const FALLBACK_INITIALS_LENGTH = 2;
const FALLBACK_DELAY_MS = 150;

const statusLabelMap = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  away: 'Away',
  none: '',
} as const;

const avatarVariants = cva(
  'relative inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-muted text-foreground select-none',
  {
    variants: {
      size: {
        xs: 'size-6 text-[10px]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
        xl: 'size-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const fallbackVariants = cva(
  'flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground uppercase',
  {
    variants: {
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const statusIndicatorVariants = cva(
  'absolute right-0 bottom-0 rounded-full ring-2 ring-background',
  {
    variants: {
      size: {
        xs: 'size-2',
        sm: 'size-2.5',
        md: 'size-3',
        lg: 'size-3.5',
        xl: 'size-4',
      },
      status: {
        online: 'bg-success',
        offline: 'bg-muted-foreground',
        busy: 'bg-destructive',
        away: 'bg-primary',
        none: 'hidden',
      },
    },
    defaultVariants: {
      size: 'md',
      status: 'none',
    },
  },
);

export interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  status?: keyof typeof statusLabelMap;
  imageClassName?: string;
  fallbackClassName?: string;
  statusClassName?: string;
}

function getInitials(name?: string) {
  if (!name) {
    return AVATAR_FALLBACK_TEXT;
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, FALLBACK_INITIALS_LENGTH);

  if (parts.length === 0) {
    return AVATAR_FALLBACK_TEXT;
  }

  return parts
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    {
      className,
      size = 'md',
      src,
      alt,
      name,
      fallback,
      status = 'none',
      imageClassName,
      fallbackClassName,
      statusClassName,
      ...props
    },
    ref,
  ) => {
    const fallbackText = fallback ?? getInitials(name);
    const accessibleAlt = alt ?? name ?? AVATAR_IMAGE_ALT;
    const statusLabel = statusLabelMap[status];
    const ariaLabel = statusLabel
      ? `${accessibleAlt}, ${statusLabel}`
      : accessibleAlt;

    return (
      <span className="relative inline-flex shrink-0">
        <AvatarPrimitive.Root
          ref={ref}
          data-slot="avatar"
          data-size={size ?? undefined}
          aria-label={ariaLabel}
          className={cn(avatarVariants({ size, className }))}
          {...props}
        >
          {src ? (
            <AvatarPrimitive.Image
              src={src}
              alt={accessibleAlt}
              className={cn('size-full object-cover', imageClassName)}
            />
          ) : null}
          <AvatarPrimitive.Fallback
            delayMs={FALLBACK_DELAY_MS}
            className={cn(fallbackVariants({ size }), fallbackClassName)}
          >
            {fallbackText}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {status !== 'none' ? (
          <span
            aria-hidden="true"
            data-status={status}
            className={cn(
              statusIndicatorVariants({ size, status }),
              statusClassName,
            )}
          />
        ) : null}
      </span>
    );
  },
);

Avatar.displayName = 'Avatar';
