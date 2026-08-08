import { createApi } from '@reduxjs/toolkit/query/react';
import type { Paginated, ServiceItem } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface ServiceSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many services to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only service bridge for the section collection panel's `picked`-ids ServerSelect
 * (W5) — the picker consumes THIS, never `modules/content` service api directly. A `services`
 * section's `config.ids` reference content `service` records, chosen from the public service list.
 *
 * `GET /content/services` returns a `Paginated<ServiceItem>` with server-side `search`/`page`.
 * There is no by-id route, so resolving the selected ids (to render the saved values' names, pinned
 * first) fetches a large page and filters client-side — the team-lookup pattern, fine for a bounded
 * service set.
 */
export const serviceLookupApi = createApi({
  reducerPath: 'serviceLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchServiceLookup: builder.query<
      Paginated<ServiceItem>,
      ServiceSearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/services',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getServicesByIds: builder.query<ServiceItem[], string[]>({
      query: () => ({
        url: '/content/services',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<ServiceItem>,
        _meta,
        ids: string[],
      ): ServiceItem[] =>
        res.items.filter((service) => ids.includes(service.id)),
    }),
  }),
});

export const { useSearchServiceLookupQuery, useGetServicesByIdsQuery } =
  serviceLookupApi;

registerApi(serviceLookupApi);
