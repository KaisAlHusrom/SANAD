import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
}

/**
 * A dashboard headline metric (design-spec §4): a bordered surface card with the label, the
 * tinted metric icon, and the value. Tokens-only (U6). The integer renders in Western digits
 * regardless of locale (no inline `Intl`, F8) — counts are language-neutral.
 */
export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-5 shadow-portal">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-dim">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-card bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-accent">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <span className="text-3xl font-semibold tracking-tight text-text">
        {value}
      </span>
    </div>
  );
}
