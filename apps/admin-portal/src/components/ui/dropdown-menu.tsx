import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { useDirection } from '../../providers/direction';
import { cn } from '../../lib/cn';

/**
 * Dropdown menu on the token system (W2) — the DataTable's row-actions ("⋯") menu and the
 * column-visibility menu. Direction-aware (U7): the resolved `dir` is fed to Radix so
 * logical `align`/side follow the active locale (the app uses a custom DirectionProvider,
 * not Radix's, so the primitive injects direction itself).
 */
export function DropdownMenu(
  props: ComponentPropsWithoutRef<typeof RadixDropdown.Root>,
) {
  const { direction } = useDirection();
  return <RadixDropdown.Root dir={direction} {...props} />;
}

export const DropdownMenuTrigger = RadixDropdown.Trigger;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixDropdown.Content>,
  ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(({ className, align = 'end', sideOffset = 4, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-32 rounded-md border border-border-2 bg-surface p-1 shadow-portal focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixDropdown.Item>,
  ComponentPropsWithoutRef<typeof RadixDropdown.Item>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-nav px-2 py-1.5 text-sm text-text outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixDropdown.Separator>,
  ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Separator
    ref={ref}
    className={cn('my-1 h-px bg-border-2', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel = RadixDropdown.Label;
export const DropdownMenuCheckboxItem = RadixDropdown.CheckboxItem;
