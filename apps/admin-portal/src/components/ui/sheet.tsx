import * as RadixDialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * A slide-in side panel on the token system (W2) — the reusable Drawer/Sheet (07-plan Wave 3).
 * Built on Radix Dialog, so it keeps a11y + Esc + focus behaviour, but docks to a screen edge and
 * can run **non-modal** (`modal={false}`, no dimming overlay) so the surface behind it stays
 * interactive — the Content Studio's structural rail floats over the live canvas without blocking it.
 * The panel caps its height and scrolls its body internally (U21c) between a fixed `SheetHeader` and
 * `SheetFooter`. Docking + the slide-in are **direction-aware** (logical `border-s/e` + a `[dir]`-keyed
 * keyframe in `global.css`), never physical left/right (U7).
 */
const SheetModalContext = createContext(true);

export function Sheet({
  modal = true,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDialog.Root>) {
  return (
    <SheetModalContext.Provider value={modal}>
      <RadixDialog.Root modal={modal} {...props}>
        {children}
      </RadixDialog.Root>
    </SheetModalContext.Provider>
  );
}

export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;
export const SheetTitle = RadixDialog.Title;
export const SheetDescription = RadixDialog.Description;

const sheetContentVariants = cva(
  'sheet-panel scroll-area fixed inset-y-0 z-50 flex w-[min(26rem,calc(100vw-1.5rem))] flex-col gap-0 overflow-hidden border-border-2 bg-surface shadow-portal focus-visible:outline-none',
  {
    variants: {
      side: {
        // Docked to the inline-end edge → its inner (start) border shows; slides in from that edge.
        // `end-0`/`start-0` are Tailwind's logical `inset-inline-end/start: 0` (RTL-safe, U7).
        'inline-end': 'end-0 border-s',
        'inline-start': 'start-0 border-e',
      },
    },
    defaultVariants: { side: 'inline-end' },
  },
);

export const SheetContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> &
    VariantProps<typeof sheetContentVariants>
>(({ className, side = 'inline-end', children, ...props }, ref) => {
  const modal = useContext(SheetModalContext);
  return (
    <RadixDialog.Portal>
      {modal ? (
        <RadixDialog.Overlay className="sheet-overlay fixed inset-0 z-40 bg-scrim backdrop-blur-sm" />
      ) : null}
      <RadixDialog.Content
        ref={ref}
        data-side={side}
        className={cn(sheetContentVariants({ side }), className)}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
SheetContent.displayName = 'SheetContent';

/** Fixed (non-scrolling) header band. */
export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-border-2 px-4 py-3',
        className,
      )}
      {...props}
    />
  );
}

/** The scrollable body — the only region that scrolls. */
export function SheetBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('scroll-area flex-1 overflow-y-auto px-4 py-4', className)}
      {...props}
    />
  );
}

/** Fixed (non-scrolling) action footer. */
export function SheetFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 border-t border-border-2 px-4 py-3',
        className,
      )}
      {...props}
    />
  );
}
