import { Command as CommandPrimitive } from 'cmdk';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Command list on the token system (W2) — the searchable, keyboard-navigable listbox the
 * ServerSelect renders inside a Popover. `shouldFilter={false}`: filtering is SERVER-side
 * (debounced query), so cmdk must not also filter the already-narrowed results client-side.
 */
export const Command = forwardRef<
  ElementRef<typeof CommandPrimitive>,
  ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    shouldFilter={false}
    className={cn('flex flex-col gap-1', className)}
    {...props}
  />
));
Command.displayName = 'Command';

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-input border border-border-2 bg-surface px-3 text-sm text-text placeholder:text-faint focus-visible:border-accent-line focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
CommandInput.displayName = 'CommandInput';

export const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-64 overflow-y-auto', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

export const CommandEmpty = forwardRef<
  ElementRef<typeof CommandPrimitive.Empty>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn('px-2 py-6 text-center text-sm text-dim', className)}
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = forwardRef<
  ElementRef<typeof CommandPrimitive.Group>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn('flex flex-col', className)}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-nav px-2 py-1.5 text-sm text-text outline-none',
      'data-[selected=true]:bg-surface-2 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';
