import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  iconSize?: number; // Optional size prop
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  iconSize = 40, // Default to 40px
  title,
  description,
  actionText,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="mb-4 flex items-center justify-center rounded-full bg-muted p-4">
        {/* Pass the size directly to the Lucide icon */}
        <Icon
          size={iconSize}
          className="text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 mb-6 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>
      {actionText && <Button onClick={onActionClick}>{actionText}</Button>}
    </div>
  );
}
