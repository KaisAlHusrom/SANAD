import type { WhereOp } from './query-operators.js';

/** A whitelisted column filter: maps a query-param key to a real column + a fixed SQL operator. */
export interface ColumnFilter {
  kind: 'column';
  field: string;
  op: WhereOp;
}

/** A free-text `search` filter over declared base columns (+ optional translatable fields). */
export interface SearchFilter {
  kind: 'search';
  /** Base columns matched with `contains` (ilike `%term%`), OR-combined. */
  columns: string[];
  /** Translatable fields resolved via `searchAcrossLocales` → `id IN (...)` (any locale). */
  translatableFields?: string[];
}

export type FilterEntry = ColumnFilter | SearchFilter;

/**
 * Whitelist mapping a query-param name → its filter behaviour (N7). ONLY params present
 * here are ever applied; anything else is rejected upstream by the resource's `.strict()`
 * Zod schema. **Never** add `deletedAt` — the soft-delete scope (N2) stays non-bypassable
 * (the filter layer only ADDS where-conditions; it cannot remove the global scope).
 */
export type FilterSpec = Record<string, FilterEntry>;
