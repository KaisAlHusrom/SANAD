import { createApi } from '@reduxjs/toolkit/query/react';
import type { Paginated, PortfolioCategoryItem } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface CategorySearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many categories to fetch when resolving selected ids (a small, bounded lookup set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only portfolio-category bridge for the project form's ServerSelect (W5) — the
 * picker consumes THIS, never `modules/portfolio/api` directly. Its own reducerPath keeps the
 * picker cache decoupled from the categories module's own list cache.
 *
 * `GET /content/portfolio-categories` returns a `Paginated<PortfolioCategoryItem>` and supports
 * server-side `search`/`page`. There is no by-id route, so resolving already-selected ids (to
 * render a saved value's label, pinned first) fetches a large page and filters client-side — the
 * folder-lookup pattern, fine for a bounded category set.
 */
export const portfolioCategoryLookupApi = createApi({
  reducerPath: 'portfolioCategoryLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchPortfolioCategoryLookup: builder.query<
      Paginated<PortfolioCategoryItem>,
      CategorySearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/portfolio-categories',
        // `search` is `.min(1)` at the gateway — omit it when blank (an empty box browses all).
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getPortfolioCategoriesByIds: builder.query<
      PortfolioCategoryItem[],
      string[]
    >({
      query: () => ({
        url: '/content/portfolio-categories',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<PortfolioCategoryItem>,
        _meta,
        ids: string[],
      ): PortfolioCategoryItem[] =>
        res.items.filter((category) => ids.includes(category.id)),
    }),
  }),
});

export const {
  useSearchPortfolioCategoryLookupQuery,
  useGetPortfolioCategoriesByIdsQuery,
} = portfolioCategoryLookupApi;

registerApi(portfolioCategoryLookupApi);
