import type { ListQuery } from '@sanad/contracts';
import type { PaginateArgs } from './repository.types.js';

/**
 * Adapt the contract `ListQuery` (page/pageSize/sort/order/search) to the repository's
 * `PaginateArgs`. The builder's sort spec is `field` / `-field`, so a `desc` order maps
 * to a leading `-`. Search is applied separately via a `FilterSpec`.
 */
export function paginateArgsFromListQuery(query: ListQuery): PaginateArgs {
  return {
    page: query.page,
    pageSize: query.pageSize,
    sort:
      query.sort === undefined
        ? undefined
        : query.order === 'desc'
          ? `-${query.sort}`
          : query.sort,
  };
}
