import * as RadixDialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { DialogDepthProvider, useDialogDepth } from './dialog-stack';

/**
 * Modal dialog on the token system (W2). Centering is direction-agnostic (U7); the content
 * **caps its height and scrolls internally** (U21c) so a tall modal never runs off-screen.
 * Simple modals pass flat children (the default padded, single-scroll box); structured modals
 * compose `DialogHeader` + `DialogBody` (the scroll region) + `DialogFooter` — passing
 * `className="gap-0 overflow-hidden p-0"` to DialogContent so only the body scrolls between a
 * fixed header and a fixed action footer.
 */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

const dialogContentVariants = cva(
  'scroll-area flex max-h-[min(90vh,calc(100dvh-2rem))] flex-col gap-4 overflow-y-auto rounded-md border border-border-2 bg-surface p-6 shadow-portal focus-visible:outline-none',
  {
    variants: {
      size: {
        sm: 'w-[min(28rem,calc(100vw-2rem))]',
        md: 'w-[min(32rem,calc(100vw-2rem))]',
        lg: 'w-[min(48rem,calc(100vw-2rem))]',
        /** For a nested layer that must read as WIDER than the form it opened over. */
        xl: 'w-[min(64rem,calc(100vw-2rem))]',
        /** Near-full-viewport, for a genuine workspace (a file explorer, a preview). */
        full: 'h-[min(90vh,calc(100dvh-2rem))] w-[min(90rem,calc(100vw-2rem))]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/**
 * One z-step per nesting level. Base overlay 40 / content 50 (unchanged for a lone dialog);
 * each nested layer adds `Z_STEP` so a child always paints over its parent — instead of relying
 * on DOM order, which is what made a nested picker look like a REPLACEMENT for the form beneath
 * it rather than a layer above it.
 */
const Z_OVERLAY_BASE = 40;
const Z_CONTENT_BASE = 50;
const Z_STEP = 10;

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> &
    VariantProps<typeof dialogContentVariants>
>((props, ref) => (
  /*
   * The stack registration lives in `StackedDialogContent`, INSIDE the Portal, because
   * `RadixDialog.Portal` renders nothing while the dialog is closed — so a mounted-but-closed
   * dialog (every picker sitting next to its field, waiting to be opened) never claims a depth.
   * Registering out here instead would make each closed picker inflate the count and push its
   * own parent into the receded state with nothing above it. Caught by `dialog-stack.spec`.
   */
  <RadixDialog.Portal>
    <StackedDialogContent {...props} ref={ref} />
  </RadixDialog.Portal>
));
DialogContent.displayName = 'DialogContent';

const StackedDialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> &
    VariantProps<typeof dialogContentVariants>
>(({ className, size, children, ...props }, ref) => {
  const { depth, isBehind } = useDialogDepth();

  return (
    <>
      <RadixDialog.Overlay
        className="fixed inset-0 bg-bg/70 backdrop-blur-sm"
        // Runtime stacking value (U6 carve-out: genuine computed data, not a design token).
        style={{ zIndex: Z_OVERLAY_BASE + depth * Z_STEP }}
      />
      {/* Flex-centered so the modal stays centered in both LTR and RTL (no physical
          left/right, no transform sign-flip — U7). */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: Z_CONTENT_BASE + depth * Z_STEP }}
      >
        <RadixDialog.Content
          ref={ref}
          data-dialog-depth={depth}
          // A dialog with a layer above it RECEDES: scaled back, dimmed, and inert, so the two
          // levels read as a stack rather than as two competing boxes. `motion-safe` keeps it
          // instant for reduced-motion users (WEB4).
          data-behind={isBehind ? '' : undefined}
          className={cn(
            dialogContentVariants({ size }),
            'origin-center transition-[transform,opacity] duration-200 motion-reduce:transition-none',
            isBehind && 'pointer-events-none scale-[0.96] opacity-60',
            className,
          )}
          {...props}
        >
          <DialogDepthProvider value={{ depth, isBehind }}>
            {children}
          </DialogDepthProvider>
        </RadixDialog.Content>
      </div>
    </>
  );
});
StackedDialogContent.displayName = 'StackedDialogContent';

/**
 * Fixed (non-scrolling) header band for a structured dialog. Pair with `DialogBody` +
 * `DialogFooter` and give DialogContent `className="gap-0 overflow-hidden p-0"`.
 */
export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-1 border-b border-border-2 px-6 py-4',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The header of a NESTED dialog: a back control plus the trail of what it opened from
 * ("مشروع جديد ▸ مكتبة الوسائط"), so the user always knows they are one layer deep and how to
 * step back. `onBack` closes only THIS layer, leaving the parent form exactly as it was.
 *
 * The chevron is a logical-direction glyph: it must mirror under RTL (U7), which it does because
 * it is chosen from the document direction rather than hard-coded.
 */
export function DialogStackHeader({
  parentTitle,
  title,
  description,
  backLabel,
  onBack,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** The surface this dialog was opened from — the first crumb. */
  parentTitle?: string;
  title: string;
  description?: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <DialogHeader className={cn('gap-2', className)} {...props}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="-ms-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-dim transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
        >
          {/* Mirrors with direction: `rtl:rotate-180` flips the arrow, never a left/right class. */}
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        </button>

        <nav
          aria-label={backLabel}
          className="flex min-w-0 items-center gap-1.5 text-sm"
        >
          {parentTitle ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="truncate text-dim transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
              >
                {parentTitle}
              </button>
              <ChevronLeft
                className="size-3.5 shrink-0 rotate-180 text-faint rtl:rotate-0"
                aria-hidden="true"
              />
            </>
          ) : null}
          <DialogTitle className="truncate font-semibold text-text">
            {title}
          </DialogTitle>
        </nav>
      </div>
      {description ? (
        <DialogDescription className="text-sm text-dim">
          {description}
        </DialogDescription>
      ) : null}
    </DialogHeader>
  );
}

/** The scrollable body of a structured dialog — the only region that scrolls. */
export function DialogBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('scroll-area flex-1 overflow-y-auto px-6 py-4', className)}
      {...props}
    />
  );
}

/** Fixed (non-scrolling) action footer for a structured dialog. */
export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-end gap-2 border-t border-border-2 px-6 py-4',
        className,
      )}
      {...props}
    />
  );
}
