import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * Multiline text field on the token system — the textarea counterpart of `Input`,
 * matching the canon editor textarea (design-spec §4 / `Sanad Admin.dc.html`). Spreads
 * props so it works RHF-registered (`{...register(name)}`) like the native control it
 * replaces (U21: a real component, never a bare `<textarea>`).
 */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-24 w-full resize-y rounded-input border border-border-2 bg-surface px-3 py-2 text-sm leading-relaxed text-text placeholder:text-faint focus-visible:border-accent-line focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
