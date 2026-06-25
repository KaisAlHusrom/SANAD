import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-input border border-border-2 bg-surface px-3 text-sm text-text placeholder:text-faint focus-visible:border-accent-line focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
