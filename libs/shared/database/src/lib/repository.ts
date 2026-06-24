import type { Paginated } from '@sanad/contracts';

/**
 * A page of results plus its pagination metadata. Alias of the contract-owned wire
 * shape (`Paginated<T>`, U3) so repos and the API speak the same shape. The concrete
 * data-access surface is the enhanced `BaseRepository` / `TranslatableRepository` canon
 * (`./drizzle/repository`, N1/N5).
 */
export type Page<TEntity> = Paginated<TEntity>;
