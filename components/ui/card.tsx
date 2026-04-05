import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Props for the Card component.
 */
interface CardProps {
  /** Card heading */
  title: string;
  /** Main content area */
  children: React.ReactNode;
  /** Optional action area rendered at the bottom of the card */
  action?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Reusable card component for displaying information such as tools, materials, or projects.
 */
export function Card({ title, children, action, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 p-6">
        <h3 className="text-base font-semibold leading-none">{title}</h3>
      </div>
      <div className="p-6 pt-0">{children}</div>
      {action && <div className="flex items-center p-6 pt-0">{action}</div>}
    </div>
  );
}
