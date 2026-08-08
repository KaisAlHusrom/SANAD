import * as RadixContextMenu from '@radix-ui/react-context-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { useDirection } from '../../providers/direction';
import { cn } from '../../lib/cn';

/**
 * Right-click context menu on the token system (W2) — the media explorer's per-item actions
 * ("Preview / Download / Delete" on a file, "Open / Rename / Delete" on a folder). It mirrors the
 * dropdown-menu's look exactly, so a menu opened by a right-click and one opened by a "⋯" button
 * read as the same object; only the trigger differs (a cursor position vs a button).
 *
 * Direction-aware (U7): the resolved `dir` is fed to Radix so the menu opens along the reading
 * direction. The app uses its own DirectionProvider (not Radix's), so the primitive injects it.
 */
export function ContextMenu(
  props: ComponentPropsWithoutRef<typeof RadixContextMenu.Root>,
) {
  const { direction } = useDirection();
  return <RadixContextMenu.Root dir={direction} {...props} />;
}

/** Wraps the element that should open the menu on right-click / long-press. */
export const ContextMenuTrigger = RadixContextMenu.Trigger;

export const ContextMenuContent = forwardRef<
  ElementRef<typeof RadixContextMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixContextMenu.Content>
>(({ className, ...props }, ref) => (
  <RadixContextMenu.Portal>
    <RadixContextMenu.Content
      ref={ref}
      className={cn(
        'z-50 min-w-40 rounded-md border border-border-2 bg-surface p-1 shadow-portal focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  </RadixContextMenu.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = forwardRef<
  ElementRef<typeof RadixContextMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixContextMenu.Item>
>(({ className, ...props }, ref) => (
  <RadixContextMenu.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer items-center gap-2 rounded-nav px-2 py-1.5 text-sm text-text outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuSeparator = forwardRef<
  ElementRef<typeof RadixContextMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixContextMenu.Separator>
>(({ className, ...props }, ref) => (
  <RadixContextMenu.Separator
    ref={ref}
    className={cn('my-1 h-px bg-border-2', className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

export const ContextMenuLabel = forwardRef<
  ElementRef<typeof RadixContextMenu.Label>,
  ComponentPropsWithoutRef<typeof RadixContextMenu.Label>
>(({ className, ...props }, ref) => (
  <RadixContextMenu.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs text-faint', className)}
    {...props}
  />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';
