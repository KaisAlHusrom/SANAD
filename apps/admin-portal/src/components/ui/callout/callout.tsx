import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';

/**
 * The inline notice panel — a tinted, bordered block for a warning, a verdict, or a caveat that
 * belongs beside the control it is about.
 *
 * The tones use the same explicit `color-mix` canon as `Badge`, and that is **load-bearing**:
 * the semantic colors are `var(--token)` values, and Tailwind 3.4's opacity modifier
 * (`bg-warn/10`, `border-warn/30`) generates **no CSS at all** for them — it silently emits
 * nothing, so a panel written that way renders as bare text with no tint and no border. Two
 * panels in the integrations module shipped exactly that way before this primitive existed
 * (P8.23.A1). Never reintroduce an opacity modifier on a token color here.
 */
export type CalloutTone = 'good' | 'warn' | 'bad' | 'accent' | 'neutral';

/** The tone paint, exported so a panel with its own layout tints identically (U3). */
export const CALLOUT_TONE_CLASSES: Record<CalloutTone, string> = {
  good: 'text-good border-[color-mix(in_oklab,var(--good)_35%,transparent)] bg-[color-mix(in_oklab,var(--good)_10%,transparent)]',
  warn: 'text-warn border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)]',
  bad: 'text-bad border-[color-mix(in_oklab,var(--bad)_35%,transparent)] bg-[color-mix(in_oklab,var(--bad)_10%,transparent)]',
  accent:
    'text-accent border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]',
  neutral: 'text-dim border-border-2 bg-surface-2',
};

const calloutVariants = cva(
  'flex items-start gap-2 rounded-card border px-3 py-2 text-sm',
  {
    variants: { tone: CALLOUT_TONE_CLASSES },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface CalloutProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof calloutVariants> {
  /** A leading icon, already sized by the caller (`size-4 shrink-0`). */
  icon?: ReactNode;
}

export function Callout({
  tone,
  icon,
  className,
  children,
  ...rest
}: CalloutProps) {
  return (
    <div className={cn(calloutVariants({ tone }), className)} {...rest}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </div>
  );
}
