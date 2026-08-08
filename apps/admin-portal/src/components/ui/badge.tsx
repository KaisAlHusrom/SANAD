import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * Status-pill geometry + tones from design-spec §4: a solid token text color over a
 * `color-mix` tint of the same token (the canon status mixing). `neutral` falls back to the
 * surface-2 chip. The arbitrary `color-mix(...)` values are intentional — the tint is not a
 * stock Tailwind utility (U6 carve-out, single-sourced here so callers never re-derive it).
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        good: 'text-good bg-[color-mix(in_oklab,var(--good)_16%,transparent)]',
        warn: 'text-warn bg-[color-mix(in_oklab,var(--warn)_16%,transparent)]',
        bad: 'text-bad bg-[color-mix(in_oklab,var(--bad)_16%,transparent)]',
        accent:
          'text-accent bg-[color-mix(in_oklab,var(--accent)_18%,transparent)]',
        neutral: 'text-faint bg-surface-2',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Render a leading status dot in the current tone color. */
  dot?: boolean;
}

/**
 * Tokenized status pill / badge. Replaces ad-hoc status text and inline chips across the
 * admin (U21: proper reusable component, F9: reuse-before-create).
 */
export function Badge({ tone, dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...rest}>
      {dot ? (
        <span className="size-1.5 rounded-pill bg-current" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
