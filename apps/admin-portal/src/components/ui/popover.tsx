import * as RadixPopover from '@radix-ui/react-popover';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Popover on the token system (W2). The content is width-matched to the trigger
 * (`--radix-popover-trigger-width`) and opens below, so logical `align="start"` tracks the
 * trigger edge correctly in both LTR and RTL without a direction override (U7). Radix
 * `Popover.Root` takes no `dir` prop; primitives that navigate horizontally (DropdownMenu)
 * inject direction themselves.
 */
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;

export const PopoverContent = forwardRef<
  ElementRef<typeof RadixPopover.Content>,
  ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <RadixPopover.Portal>
    <RadixPopover.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 rounded-md border border-border-2 bg-surface p-1 shadow-portal focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  </RadixPopover.Portal>
));
PopoverContent.displayName = 'PopoverContent';
