import { or, type SQL } from 'drizzle-orm';
import type { Paginated } from '@sanad/contracts';
import type { WhereOp } from './query-operators.js';
import {
  initialBuilderState,
  type BuilderState,
  type PaginateArgs,
  type RepoExecutor,
} from './repository.types.js';

/**
 * Immutable (copy-on-write) fluent query builder. Each chainable method returns a NEW
 * `RepoQuery` so a base query can be branched safely. Terminal methods delegate to the
 * executor (`BaseRepository`).
 */
export class RepoQuery<TSelect> {
  constructor(
    private readonly executor: RepoExecutor<TSelect>,
    private readonly state: BuilderState = initialBuilderState(),
  ) {}

  private extend(patch: Partial<BuilderState>): RepoQuery<TSelect> {
    return new RepoQuery(this.executor, { ...this.state, ...patch });
  }

  // --- chainable constraints ---
  where(field: string, op: WhereOp, value: unknown): RepoQuery<TSelect> {
    return this.extend({
      wheres: [
        ...this.state.wheres,
        this.executor.conditionFor(field, op, value),
      ],
    });
  }

  whereIn(field: string, values: unknown[]): RepoQuery<TSelect> {
    return this.extend({
      wheres: [
        ...this.state.wheres,
        this.executor.conditionFor(field, 'in', values),
      ],
    });
  }

  scope(name: string): RepoQuery<TSelect> {
    return this.extend({
      wheres: [...this.state.wheres, this.executor.scopeCondition(name)],
    });
  }

  /**
   * Add an OR group: at least one of the given conditions must hold. The group is ANDed
   * with every other where (and the soft-delete scope), so it can never widen results
   * past the global scopes. Use {@link condition} to build them. Empty list is a no-op.
   */
  whereAny(conditions: SQL[]): RepoQuery<TSelect> {
    if (conditions.length === 0) {
      return this;
    }
    const first = conditions[0];
    if (conditions.length === 1 && first) {
      return this.extend({ wheres: [...this.state.wheres, first] });
    }
    // ≥2 conditions here, so drizzle's `or()` cannot return undefined.
    return this.extend({
      wheres: [...this.state.wheres, or(...conditions) as SQL],
    });
  }

  /**
   * Build a raw whitelisted column condition WITHOUT appending it — for callers
   * assembling an OR group to hand to {@link whereAny}. Validated by the executor (N7).
   */
  condition(field: string, op: WhereOp, value: unknown): SQL {
    return this.executor.conditionFor(field, op, value);
  }

  with(...relations: string[]): RepoQuery<TSelect> {
    return this.extend({ relations: [...this.state.relations, ...relations] });
  }

  withCount(...relations: string[]): RepoQuery<TSelect> {
    return this.extend({ withCount: [...this.state.withCount, ...relations] });
  }

  withTrashed(): RepoQuery<TSelect> {
    return this.extend({ includeTrashed: true });
  }

  onlyTrashed(): RepoQuery<TSelect> {
    return this.extend({ onlyTrashed: true });
  }

  withHidden(): RepoQuery<TSelect> {
    return this.extend({ includeHidden: true });
  }

  // --- terminals ---
  find(id: string): Promise<TSelect | null> {
    return this.executor.runFind(this.state, id);
  }

  first(): Promise<TSelect | null> {
    return this.executor.runFirst(this.state);
  }

  all(): Promise<TSelect[]> {
    return this.executor.runMany(this.state);
  }

  paginate(args: PaginateArgs = {}): Promise<Paginated<TSelect>> {
    return this.executor.runPaginate(this.state, args);
  }

  count(): Promise<number> {
    return this.executor.runCount(this.state);
  }
}
