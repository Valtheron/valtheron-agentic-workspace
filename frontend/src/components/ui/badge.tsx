import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent-cyan text-background-DEFAULT',
        secondary: 'border-transparent bg-background-surface text-text-secondary',
        destructive: 'border-transparent bg-accent-red text-text-primary',
        outline: 'border-border-DEFAULT text-text-secondary',
        success: 'border-transparent bg-accent-green text-background-DEFAULT',
        warning: 'border-transparent bg-accent-orange text-background-DEFAULT',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
