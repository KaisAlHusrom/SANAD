import type { Column, SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/** Supported read-time type coercions for a column value. */
export type Cast = 'number' | 'boolean' | 'date' | 'json' | 'string';

/** A computed attribute injected into output, derived from the raw row. */
export type Append = (row: Record<string, unknown>) => unknown;

/** A reusable named query condition, built from the table's columns. */
export type ScopeFn = (columns: Record<string, Column>) => SQL;

/**
 * Declares how to batch-count a child relation for `withCount()`:
 *   SELECT count(*) FROM <table> WHERE <foreignKey> IN (parentIds)
 */
export interface RelationCount {
  table: PgTable;
  /** The FK column name on the child table that references this model's primary key. */
  foreignKey: string;
  /** Whether the child table is soft-deletable (excludes soft-deleted children). */
  softDeletes?: boolean;
}

/** Translatable configuration (N5): translatable columns live in a dedicated translations table. */
export interface TranslatableConfig {
  table: PgTable;
  /** The FK column name on the translation table that references this model's primary key. */
  foreignKey: string;
  /** The translatable column names present on the translation table. */
  fields: string[];
}

/**
 * Per-model configuration consumed by `BaseRepository` (N1). One object per concrete
 * repository declares the table's hidden fields, casts, computed appends,
 * mass-assignment policy, soft-delete behaviour, named scopes, withCount relations, and
 * translatable setup. This is the smart-restaurant repository canon.
 */
export interface ModelConfig<TTable extends PgTable> {
  table: TTable;
  /** Primary key column name (default 'id'). */
  primaryKey?: string;
  /** Columns stripped from output unless `withHidden()` is used (N2). */
  hidden?: string[];
  /** Mass-assignment allow-list. When set, only these keys are accepted on create/update. */
  fillable?: string[] | null;
  /** Mass-assignment deny-list (used when `fillable` is null/undefined). */
  guarded?: string[];
  /** Read-time type coercions keyed by column name. */
  casts?: Record<string, Cast>;
  /** Computed attributes injected into output keyed by the new attribute name. */
  appends?: Record<string, Append>;
  /** Reusable named query scopes. */
  scopes?: Record<string, ScopeFn>;
  /** Whether `deleted_at`-based soft deletes apply (default true, N2). */
  softDeletes?: boolean;
  /** withCount-able child relations keyed by relation name. */
  relationCounts?: Record<string, RelationCount>;
  /** Translatable setup; presence enables `TranslatableRepository` behaviour (N5). */
  translatable?: TranslatableConfig;
}
