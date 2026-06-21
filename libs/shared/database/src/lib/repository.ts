import type { ListQuery, Locale, PaginationMeta } from '@sanad/contracts';

/** A page of results plus its pagination metadata. */
export interface Page<TEntity> {
  items: TEntity[];
  meta: PaginationMeta;
}

/**
 * The fluent data-access contract every service repository implements (N1).
 * The concrete Drizzle-backed BaseRepository lands with the first service that
 * owns a database (P2+); P0 fixes the shape so every service shares it.
 */
export interface Repository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  list(query: ListQuery): Promise<Page<TEntity>>;
  create(input: Partial<TEntity>): Promise<TEntity>;
  update(id: TId, input: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

/**
 * A repository for entities with translatable columns. It can resolve a single
 * locale's text for read endpoints (W6/N5).
 */
export interface TranslatableRepository<
  TEntity,
  TId = string,
> extends Repository<TEntity, TId> {
  findByIdLocalized(id: TId, locale: Locale): Promise<TEntity | null>;
  listLocalized(query: ListQuery, locale: Locale): Promise<Page<TEntity>>;
}
