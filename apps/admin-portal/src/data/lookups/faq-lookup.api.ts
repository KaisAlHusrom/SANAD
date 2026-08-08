import { createApi } from '@reduxjs/toolkit/query/react';
import type { FaqItem, Paginated } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface FaqSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many FAQs to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only FAQ bridge for the section collection panel's `picked`-ids ServerSelect (W5) —
 * the picker consumes THIS, never the `modules/faqs` api directly. A `faq` section's `config.ids`
 * reference content `faq` records, chosen from the list. FAQs have no `title` — the picker labels each
 * by its `question` (translatable) at the call site.
 *
 * `GET /content/faqs` returns a `Paginated<FaqItem>` with server-side `search`/`page`. There is no
 * by-id route, so resolving the selected ids fetches a large page and filters client-side — the
 * testimonials-lookup pattern, fine for a bounded set.
 */
export const faqLookupApi = createApi({
  reducerPath: 'faqLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchFaqLookup: builder.query<Paginated<FaqItem>, FaqSearchArg>({
      query: ({ search, page, pageSize }) => ({
        url: '/content/faqs',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getFaqsByIds: builder.query<FaqItem[], string[]>({
      query: () => ({
        url: '/content/faqs',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<FaqItem>,
        _meta,
        ids: string[],
      ): FaqItem[] => res.items.filter((item) => ids.includes(item.id)),
    }),
  }),
});

export const { useSearchFaqLookupQuery, useGetFaqsByIdsQuery } = faqLookupApi;

registerApi(faqLookupApi);
