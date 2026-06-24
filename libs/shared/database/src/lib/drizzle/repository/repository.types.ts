import type { SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Paginated } from '@sanad/contracts';
import type { WhereOp } from './query-operators.js';

/**
 * A Drizzle handle OR an open transaction — the query-builder surface the repositories
 * use. Typed as a structural `Pick` (dropping the schema-bound relational `query` API)
 * so a per-service `NodePgDatabase<typeof schema>` and a `db.transaction` tx both
 * satisfy it (DB-per-service, MS5; same-tx writes, MS3).
 */
export type RepoDb = Pick<
  NodePgDatabase<Record<string, never>>,
  'select' | 'selectDistinct' | 'insert' | 'update' | 'delete'
>;

/** Accumulated, copy-on-write state for a fluent repository query. */
export interface BuilderState {
  wheres: SQL[];
  relations: string[];
  withCount: string[];
  includeTrashed: boolean;
  onlyTrashed: boolean;
  includeHidden: boolean;
}

export function initialBuilderState(): BuilderState {
  return {
    wheres: [],
    relations: [],
    withCount: [],
    includeTrashed: false,
    onlyTrashed: false,
    includeHidden: false,
  };
}

/**
 * Batch relation loader: given parent ids, returns a map from parent id to its child
 * rows. Concrete repositories declare loaders so `with()` stays N+1-safe and fully
 * typed (no relational query-API key coupling).
 */
export type RelationLoader = (
  parentIds: string[],
) => Promise<Map<string, unknown[]>>;

/** Pagination arguments accepted by `paginate()`. */
export interface PaginateArgs {
  page?: number;
  pageSize?: number;
  /** Sort spec: `field` (asc) or `-field` (desc), restricted to real columns by the executor. */
  sort?: string;
}

/**
 * The execution surface a `RepoQuery` delegates to. `BaseRepository` implements this;
 * `RepoQuery` only accumulates state and calls these terminals. Keeps the fluent
 * builder decoupled from Drizzle.
 */
export interface RepoExecutor<TSelect> {
  conditionFor(field: string, op: WhereOp, value: unknown): SQL;
  scopeCondition(name: string): SQL;
  runFind(state: BuilderState, id: string): Promise<TSelect | null>;
  runFirst(state: BuilderState): Promise<TSelect | null>;
  runMany(state: BuilderState): Promise<TSelect[]>;
  runPaginate(
    state: BuilderState,
    args: PaginateArgs,
  ): Promise<Paginated<TSelect>>;
  runCount(state: BuilderState): Promise<number>;
}
