import type { PaginationMeta } from './pagination.js';

/**
 * The canonical wire shape for a page of results: the items plus pagination
 * metadata. Owned here (U3) so every list endpoint/message returns the same shape;
 * the repository's `Page<T>` in `@sanad/database` is an alias of this.
 */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
