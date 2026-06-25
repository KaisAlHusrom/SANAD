import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-input font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:bg-accent-2',
        secondary:
          'border border-border-2 bg-surface text-text hover:bg-surface-2',
        ghost: 'text-dim hover:bg-surface-2 hover:text-text',
      },
      size: {
        md: 'h-10 px-4 text-sm',
        sm: 'h-8 px-3 text-sm',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span
            className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
