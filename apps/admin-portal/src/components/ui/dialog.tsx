import * as RadixDialog from '@radix-ui/react-dialog';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/** Modal dialog on the token system (W2). Used for set/rotate secret, delete-confirm,
 * and the media picker. Centering is direction-agnostic; chrome is tokenized (U6). */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm" />
    {/* Flex-centered so the modal stays centered in both LTR and RTL (no physical
        left/right, no transform sign-flip — U7). */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <RadixDialog.Content
        ref={ref}
        className={cn(
          'flex w-[min(32rem,calc(100vw-2rem))] flex-col gap-4 rounded-md border border-border-2 bg-surface p-6 shadow-portal',
          'focus-visible:outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </div>
  </RadixDialog.Portal>
));
DialogContent.displayName = 'DialogContent';
