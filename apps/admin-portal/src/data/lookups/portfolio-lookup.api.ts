import { createApi } from '@reduxjs/toolkit/query/react';
import type { Paginated, PortfolioProjectItem } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface PortfolioSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many projects to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only portfolio bridge for the section collection panel's `picked`-ids ServerSelect
 * (W5) — the picker consumes THIS, never the `modules/portfolio` api directly. A `work` section's
 * `config.ids` reference content `portfolio_project` records, chosen from the published list (the
 * hydrator forces `published` on the public path, so a picked draft would be hidden anyway).
 *
 * `GET /content/portfolio` returns a `Paginated<PortfolioProjectItem>` with server-side `search`/
 * `page`. There is no by-id route, so resolving the selected ids (to render the saved values' names,
 * pinned first) fetches a large page and filters client-side — the service-lookup pattern, fine for
 * a bounded project set.
 */
export const portfolioLookupApi = createApi({
  reducerPath: 'portfolioLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchPortfolioLookup: builder.query<
      Paginated<PortfolioProjectItem>,
      PortfolioSearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/portfolio',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getPortfolioByIds: builder.query<PortfolioProjectItem[], string[]>({
      query: () => ({
        url: '/content/portfolio',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<PortfolioProjectItem>,
        _meta,
        ids: string[],
      ): PortfolioProjectItem[] =>
        res.items.filter((project) => ids.includes(project.id)),
    }),
  }),
});

export const { useSearchPortfolioLookupQuery, useGetPortfolioByIdsQuery } =
  portfolioLookupApi;

registerApi(portfolioLookupApi);
