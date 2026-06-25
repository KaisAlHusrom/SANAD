import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** The shared empty affordance (F3) — every list/detail uses it, not ad-hoc markup. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-surface p-10 text-center">
      <p className="font-medium text-text">{title}</p>
      {description ? <p className="text-sm text-dim">{description}</p> : null}
      {action}
    </div>
  );
}
