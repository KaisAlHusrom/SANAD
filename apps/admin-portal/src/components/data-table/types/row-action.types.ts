import type { ReactNode } from 'react';

/**
 * A per-row action (edit / delete / custom). `permission` gates it per-row via the RBAC
 * hook; `hidden` hides it for specific rows. `label` is caller-translated.
 */
export interface RowAction<TRow> {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: (row: TRow) => void;
  permission?: string;
  tone?: 'default' | 'danger';
  hidden?: (row: TRow) => boolean;
}
