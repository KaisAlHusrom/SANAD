import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  getTableName,
  isNotNull,
  isNull,
  sql,
  type Column,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { buildPaginationMeta, type Paginated } from '@sanad/contracts';
import type { DateTimeService } from '../../date-time.js';
import { applyCast } from './apply-cast.js';
import { applyFilters, type FilterValues } from './apply-filters.js';
import type { FilterSpec } from './filter-spec.js';
import type { ModelConfig } from './model-config.js';
import { buildCondition, type WhereOp } from './query-operators.js';
import { RepoQuery } from './repo-query.js';
import { RecordNotFoundError } from './repository.errors.js';
import {
  initialBuilderState,
  type BuilderState,
  type PaginateArgs,
  type RelationLoader,
  type RepoDb,
  type RepoExecutor,
} from './repository.types.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

type Row = Record<string, unknown>;

function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { items, meta: buildPaginationMeta(total, page, pageSize) };
}

/**
 * The enhanced base repository — the single gateway for all DB access (N1), ported from
 * the smart-restaurant canon. Driven by a per-model {@link ModelConfig}, it provides a
 * fluent, immutable query builder plus a read pipeline that casts, injects computed
 * appends, and strips hidden fields by default (N2). Soft-deleted rows are excluded by
 * default (N2). Writes run lifecycle hooks that subclasses override for in-process side
 * effects (N6); cross-service events go through the Outbox in the application layer (MS3).
 *
 * SANAD adaptations vs smart-restaurant: no injected `EventBus` (hooks are plain
 * override seams); `db` is the structural {@link RepoDb} so it works per-service (MS5);
 * timestamps are UTC via {@link DateTimeService} (active-timezone read conversion is
 * deferred until the clock gains timezone support).
 */
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect extends Row = InferSelectModel<TTable>,
  TInsert extends Row = InferInsertModel<TTable>,
  TUpdate extends Row = Partial<TInsert>,
> implements RepoExecutor<TSelect> {
  protected readonly table: TTable;
  protected readonly columns: Record<string, Column>;
  protected readonly tableName: string;
  protected readonly pkName: string;
  protected readonly softDeletes: boolean;

  constructor(
    protected readonly db: RepoDb,
    protected readonly dateTime: DateTimeService,
    protected readonly config: ModelConfig<TTable>,
  ) {
    this.table = config.table;
    this.columns = getTableColumns(config.table);
    this.tableName = getTableName(config.table);
    this.pkName = config.primaryKey ?? 'id';
    this.softDeletes = config.softDeletes ?? true;
  }

  // ===== fluent entrypoints (delegate to RepoQuery) =====
  query(): RepoQuery<TSelect> {
    return new RepoQuery<TSelect>(this);
  }

  where(field: string, op: WhereOp, value: unknown): RepoQuery<TSelect> {
    return this.query().where(field, op, value);
  }

  whereIn(field: string, values: unknown[]): RepoQuery<TSelect> {
    return this.query().whereIn(field, values);
  }

  scope(name: string): RepoQuery<TSelect> {
    return this.query().scope(name);
  }

  with(...relations: string[]): RepoQuery<TSelect> {
    return this.query().with(...relations);
  }

  withCount(...relations: string[]): RepoQuery<TSelect> {
    return this.query().withCount(...relations);
  }

  withTrashed(): RepoQuery<TSelect> {
    return this.query().withTrashed();
  }

  onlyTrashed(): RepoQuery<TSelect> {
    return this.query().onlyTrashed();
  }

  withHidden(): RepoQuery<TSelect> {
    return this.query().withHidden();
  }

  // ===== convenience terminals on the default query =====
  find(id: string): Promise<TSelect | null> {
    return this.query().find(id);
  }

  async findOrFail(id: string): Promise<TSelect> {
    const row = await this.find(id);
    if (!row) {
      throw new RecordNotFoundError(this.tableName, id);
    }
    return row;
  }

  first(): Promise<TSelect | null> {
    return this.query().first();
  }

  paginate(args: PaginateArgs = {}): Promise<Paginated<TSelect>> {
    return this.query().paginate(args);
  }

  /**
   * Paginate with whitelisted filters + search applied (N7). Only `{ field, op }` pairs
   * in the spec reach SQL; the soft-delete scope (N2) cannot be bypassed by a filter.
   */
  async paginateFiltered(
    values: FilterValues,
    spec: FilterSpec,
    args: PaginateArgs = {},
  ): Promise<Paginated<TSelect>> {
    const query = await applyFilters(this.query(), values, spec);
    return query.paginate(args);
  }

  count(): Promise<number> {
    return this.query().count();
  }

  // ===== writes =====
  async create(data: TInsert): Promise<TSelect> {
    const prepared = await this.beforeCreate(data);
    const values = this.sanitize(prepared) as InferInsertModel<TTable>;
    const rows = (await this.db
      .insert(this.table as PgTable)
      .values(values)
      .returning()) as Row[];
    const out = this.transformRead(this.requireFirst(rows));
    await this.afterCreate(out);
    return out;
  }

  async createMany(items: TInsert[]): Promise<TSelect[]> {
    if (items.length === 0) {
      return [];
    }
    const prepared = await Promise.all(
      items.map((item) => this.beforeCreate(item)),
    );
    const values = prepared.map(
      (item) => this.sanitize(item) as InferInsertModel<TTable>,
    );
    const rows = (await this.db
      .insert(this.table as PgTable)
      .values(values)
      .returning()) as Row[];
    const out = rows.map((row) => this.transformRead(row));
    await Promise.all(out.map((row) => this.afterCreate(row)));
    return out;
  }

  async update(id: string, data: TUpdate): Promise<TSelect> {
    const existing = await this.findOrFail(id);
    const prepared = await this.beforeUpdate(id, data);
    const sanitized = this.sanitize(prepared);
    // Nothing assignable survived the mass-assignment guard — avoid Drizzle's `.set({})` error.
    if (Object.keys(sanitized).length === 0) {
      return existing;
    }
    const values = {
      ...sanitized,
      updatedAt: this.dateTime.now().toJSDate(),
    } as Partial<InferInsertModel<TTable>>;
    const rows = (await this.db
      .update(this.table)
      .set(values)
      .where(eq(this.pkColumn(), id))
      .returning()) as Row[];
    const out = this.transformRead(this.requireFirst(rows));
    await this.afterUpdate(out);
    return out;
  }

  /** Soft delete when `softDeletes` is enabled, otherwise a hard delete. */
  async delete(id: string): Promise<boolean> {
    await this.beforeDelete(id);
    let affected: number;
    if (this.softDeletes) {
      const rows = (await this.db
        .update(this.table)
        .set({
          deletedAt: this.dateTime.now().toJSDate(),
        } as Partial<InferInsertModel<TTable>>)
        .where(and(eq(this.pkColumn(), id), isNull(this.deletedAtColumn())))
        .returning()) as Row[];
      affected = rows.length;
    } else {
      const rows = (await this.db
        .delete(this.table as PgTable)
        .where(eq(this.pkColumn(), id))
        .returning()) as Row[];
      affected = rows.length;
    }
    await this.afterDelete(id);
    return affected > 0;
  }

  async restore(id: string): Promise<boolean> {
    if (!this.softDeletes) {
      return false;
    }
    const rows = (await this.db
      .update(this.table)
      .set({ deletedAt: null } as Partial<InferInsertModel<TTable>>)
      .where(and(eq(this.pkColumn(), id), isNotNull(this.deletedAtColumn())))
      .returning()) as Row[];
    return rows.length > 0;
  }

  async forceDelete(id: string): Promise<boolean> {
    const rows = (await this.db
      .delete(this.table as PgTable)
      .where(eq(this.pkColumn(), id))
      .returning()) as Row[];
    return rows.length > 0;
  }

  // ===== lifecycle hooks (override in subclasses for in-process side effects, N6) =====
  protected beforeCreate(data: TInsert): Promise<TInsert> {
    return Promise.resolve(data);
  }
  protected afterCreate(_row: TSelect): Promise<void> {
    return Promise.resolve();
  }
  protected beforeUpdate(_id: string, data: TUpdate): Promise<TUpdate> {
    return Promise.resolve(data);
  }
  protected afterUpdate(_row: TSelect): Promise<void> {
    return Promise.resolve();
  }
  protected beforeDelete(_id: string): Promise<void> {
    return Promise.resolve();
  }
  protected afterDelete(_id: string): Promise<void> {
    return Promise.resolve();
  }

  /** Override to declare batch relation loaders used by `with()`. */
  protected relationLoaders(): Record<string, RelationLoader> {
    return {};
  }

  // ===== RepoExecutor implementation (terminals used by RepoQuery) =====
  conditionFor(field: string, op: WhereOp, value: unknown): SQL {
    return buildCondition(this.column(field), op, value);
  }

  scopeCondition(name: string): SQL {
    const scopeFn = this.config.scopes?.[name];
    if (!scopeFn) {
      throw new Error(`Unknown scope '${name}' on ${this.tableName}`);
    }
    return scopeFn(this.columns);
  }

  async runFind(state: BuilderState, id: string): Promise<TSelect | null> {
    const where = this.combine([
      this.scopedWhere(state),
      eq(this.pkColumn(), id),
    ]);
    const rows = await this.fetchRows(state, { where, limit: 1 });
    return rows.length > 0
      ? this.requireFirst(this.transformRows(rows, state))
      : null;
  }

  async runFirst(state: BuilderState): Promise<TSelect | null> {
    const rows = await this.fetchRows(state, {
      where: this.scopedWhere(state),
      limit: 1,
    });
    return rows.length > 0
      ? this.requireFirst(this.transformRows(rows, state))
      : null;
  }

  async runMany(state: BuilderState): Promise<TSelect[]> {
    const rows = await this.fetchRows(state, {
      where: this.scopedWhere(state),
    });
    return this.transformRows(rows, state);
  }

  async runPaginate(
    state: BuilderState,
    args: PaginateArgs,
  ): Promise<Paginated<TSelect>> {
    const page = Math.max(1, args.page ?? DEFAULT_PAGE);
    const pageSize = Math.max(1, args.pageSize ?? DEFAULT_PAGE_SIZE);
    const where = this.scopedWhere(state);
    const rows = await this.fetchRows(state, {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sort: args.sort,
    });
    const total = await this.countWhere(where);
    const items = this.transformRows(rows, state);
    return toPaginated(items, total, page, pageSize);
  }

  runCount(state: BuilderState): Promise<number> {
    return this.countWhere(this.scopedWhere(state));
  }

  // ===== internal query execution =====
  private async fetchRows(
    state: BuilderState,
    opts: { where?: SQL; limit?: number; offset?: number; sort?: string },
  ): Promise<Row[]> {
    let q = this.db
      .select()
      .from(this.table as PgTable)
      .$dynamic();
    if (opts.where) {
      q = q.where(opts.where);
    }
    q = q.orderBy(this.orderBy(opts.sort));
    if (opts.limit !== undefined) {
      q = q.limit(opts.limit);
    }
    if (opts.offset !== undefined) {
      q = q.offset(opts.offset);
    }
    const rows = (await q) as Row[];
    const withCounts = await this.applyCounts(rows, state);
    return this.applyRelations(withCounts, state);
  }

  private async countWhere(where: SQL | undefined): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table as PgTable)
      .where(where);
    const first = result[0];
    return first ? Number(first.count) : 0;
  }

  /** withCount: one grouped query per relation, attached as `${relation}Count`. */
  private async applyCounts(rows: Row[], state: BuilderState): Promise<Row[]> {
    if (state.withCount.length === 0 || rows.length === 0) {
      return rows;
    }
    const result = rows.map((row) => ({ ...row }));

    for (const relation of state.withCount) {
      const relCfg = this.config.relationCounts?.[relation];
      if (!relCfg) {
        throw new Error(
          `Unknown count relation '${relation}' on ${this.tableName}`,
        );
      }
      const childColumns = getTableColumns(relCfg.table);
      const fkColumn = childColumns[relCfg.foreignKey];
      if (!fkColumn) {
        throw new Error(
          `Unknown foreign key '${relCfg.foreignKey}' on relation '${relation}'`,
        );
      }
      const ids = rows.map((row) => String(row[this.pkName]));
      const conditions: SQL[] = [buildCondition(fkColumn, 'in', ids)];
      if (relCfg.softDeletes) {
        const childDeletedAt = childColumns['deletedAt'];
        if (childDeletedAt) {
          conditions.push(isNull(childDeletedAt));
        }
      }
      const grouped = await this.db
        .select({ key: fkColumn, count: sql<number>`count(*)` })
        .from(relCfg.table)
        .where(and(...conditions))
        .groupBy(fkColumn);

      const countByParent = new Map<string, number>();
      for (const entry of grouped) {
        countByParent.set(String(entry.key), Number(entry.count));
      }
      for (const row of result) {
        row[`${relation}Count`] =
          countByParent.get(String(row[this.pkName])) ?? 0;
      }
    }
    return result;
  }

  /** with(): attach nested relation arrays via per-repo batch loaders. */
  private async applyRelations(
    rows: Row[],
    state: BuilderState,
  ): Promise<Row[]> {
    if (state.relations.length === 0 || rows.length === 0) {
      return rows;
    }
    const loaders = this.relationLoaders();
    const ids = rows.map((row) => String(row[this.pkName]));
    const result = rows.map((row) => ({ ...row }));

    for (const relation of state.relations) {
      const loader = loaders[relation];
      if (!loader) {
        throw new Error(`Unknown relation '${relation}' on ${this.tableName}`);
      }
      const byParent = await loader(ids);
      for (const row of result) {
        row[relation] = byParent.get(String(row[this.pkName])) ?? [];
      }
    }
    return result;
  }

  // ===== read transform pipeline (casts -> appends -> hidden) =====
  protected transformRows(rows: Row[], state: BuilderState): TSelect[] {
    return rows.map((row) => this.transformRead(row, state.includeHidden));
  }

  protected transformRead(row: Row, includeHidden = false): TSelect {
    const out: Row = { ...row };

    // 1. casts
    for (const [key, cast] of Object.entries(this.config.casts ?? {})) {
      if (key in out) {
        out[key] = applyCast(out[key], cast);
      }
    }

    // 2. appends (computed attributes)
    for (const [key, fn] of Object.entries(this.config.appends ?? {})) {
      out[key] = fn(out);
    }

    // 3. hidden fields stripped unless explicitly requested (N2)
    if (!includeHidden) {
      for (const key of this.config.hidden ?? []) {
        delete out[key];
      }
    }

    return out as TSelect;
  }

  // ===== helpers =====
  /** Combine extra wheres with the default soft-delete scope (N2). */
  protected scopedWhere(state: BuilderState): SQL | undefined {
    const parts: (SQL | undefined)[] = [...state.wheres];
    if (this.softDeletes && !state.includeTrashed) {
      parts.push(
        state.onlyTrashed
          ? isNotNull(this.deletedAtColumn())
          : isNull(this.deletedAtColumn()),
      );
    }
    return this.combine(parts);
  }

  protected combine(parts: (SQL | undefined)[]): SQL | undefined {
    const present = parts.filter((part): part is SQL => part !== undefined);
    if (present.length === 0) {
      return undefined;
    }
    return present.length === 1 ? present[0] : and(...present);
  }

  /** Mass-assignment guard: fillable allow-list, else guarded deny-list (+ always-guarded columns). */
  protected sanitize(data: Row): Row {
    const entries = Object.entries(data);
    if (this.config.fillable) {
      const allow = new Set(this.config.fillable);
      return Object.fromEntries(entries.filter(([key]) => allow.has(key)));
    }
    const deny = new Set([
      ...(this.config.guarded ?? []),
      this.pkName,
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);
    return Object.fromEntries(entries.filter(([key]) => !deny.has(key)));
  }

  protected column(name: string): Column {
    const column = this.columns[name];
    if (!column) {
      throw new Error(`Unknown column '${name}' on ${this.tableName}`);
    }
    return column;
  }

  protected pkColumn(): Column {
    return this.column(this.pkName);
  }

  protected deletedAtColumn(): Column {
    return this.column('deletedAt');
  }

  private orderBy(sort?: string): SQL {
    if (sort) {
      const descending = sort.startsWith('-');
      const field = descending ? sort.slice(1) : sort;
      if (field in this.columns) {
        const column = this.column(field);
        return descending ? desc(column) : asc(column);
      }
    }
    return asc(this.pkColumn());
  }

  protected requireFirst<T>(rows: T[]): T {
    const first = rows[0];
    if (first === undefined) {
      throw new RecordNotFoundError(
        this.tableName,
        '(insert/update returned no row)',
      );
    }
    return first;
  }

  /** A fresh builder state — for subclasses composing custom executor calls. */
  protected freshState(): BuilderState {
    return initialBuilderState();
  }
}
