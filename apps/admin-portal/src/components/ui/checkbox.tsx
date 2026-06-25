import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Checkbox on the token system (W2). Supports the tri-state `checked="indeterminate"` the
 * DataTable's select-all header uses (a minus glyph). Tokens only (U6).
 */
export const Checkbox = forwardRef<
  ElementRef<typeof RadixCheckbox.Root>,
  ComponentPropsWithoutRef<typeof RadixCheckbox.Root>
>(({ className, checked, ...props }, ref) => (
  <RadixCheckbox.Root
    ref={ref}
    checked={checked}
    className={cn(
      'grid size-4 shrink-0 place-items-center rounded-nav border border-border-2 bg-surface text-accent-ink',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
      'data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <RadixCheckbox.Indicator>
      {checked === 'indeterminate' ? (
        <Minus className="size-3" aria-hidden="true" />
      ) : (
        <Check className="size-3" aria-hidden="true" />
      )}
    </RadixCheckbox.Indicator>
  </RadixCheckbox.Root>
));
Checkbox.displayName = 'Checkbox';
