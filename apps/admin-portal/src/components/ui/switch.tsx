import * as RadixSwitch from '@radix-ui/react-switch';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Inline toggle (W6 — a toggleable status cell is a Switch wired to a mutation, not a
 * static badge). Tokens only (U6). RTL-correct: the thumb travels toward the logical end,
 * so the sign of the translate flips under `dir="rtl"` (no logical prop for transform — U7).
 */
export const Switch = forwardRef<
  ElementRef<typeof RadixSwitch.Root>,
  ComponentPropsWithoutRef<typeof RadixSwitch.Root>
>(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    ref={ref}
    className={cn(
      'inline-flex h-5 w-9 shrink-0 items-center rounded-pill border border-border-2 bg-surface-2 transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
      'disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent',
      className,
    )}
    {...props}
  >
    <RadixSwitch.Thumb
      className={cn(
        'pointer-events-none ms-0.5 block size-4 rounded-pill bg-text shadow transition-transform',
        'data-[state=checked]:ltr:translate-x-4 data-[state=checked]:rtl:-translate-x-4',
      )}
    />
  </RadixSwitch.Root>
));
Switch.displayName = 'Switch';
