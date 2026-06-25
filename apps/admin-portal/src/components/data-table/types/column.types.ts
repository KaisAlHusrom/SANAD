import type { ReactNode } from 'react';

export type ColumnAlign = 'start' | 'center' | 'end';

/**
 * A typed, fully-generic DataTable column. `header` is a caller-translated node (the kit
 * never owns domain strings — the caller's module supplies them from its own i18n
 * namespace, U8). `cell` renders the row's value. `sortKey` overrides the backend sort
 * field when it differs from `id`.
 */
export interface DataTableColumn<TRow> {
  id: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  align?: ColumnAlign;
  width?: string;
  sortable?: boolean;
  sortKey?: string;
  /** Hidden by default; the column-visibility menu can reveal it. */
  hidden?: boolean;
}
