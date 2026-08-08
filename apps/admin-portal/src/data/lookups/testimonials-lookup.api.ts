import { createApi } from '@reduxjs/toolkit/query/react';
import type { Paginated, TestimonialItem } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface TestimonialSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many testimonials to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only testimonials bridge for the section collection panel's `picked`-ids
 * ServerSelect (W5) — the picker consumes THIS, never the `modules/testimonials` api directly. A
 * `testimonials` section's `config.ids` reference content `testimonial` records, chosen from the
 * list. Testimonials have no public detail page and no `title` — the picker labels each by its
 * `authorName` (a proper noun) at the call site.
 *
 * `GET /content/testimonials` returns a `Paginated<TestimonialItem>` with server-side `search`/
 * `page`. There is no by-id route, so resolving the selected ids fetches a large page and filters
 * client-side — the service-lookup pattern, fine for a bounded set.
 */
export const testimonialsLookupApi = createApi({
  reducerPath: 'testimonialsLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchTestimonialsLookup: builder.query<
      Paginated<TestimonialItem>,
      TestimonialSearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/testimonials',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getTestimonialsByIds: builder.query<TestimonialItem[], string[]>({
      query: () => ({
        url: '/content/testimonials',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<TestimonialItem>,
        _meta,
        ids: string[],
      ): TestimonialItem[] => res.items.filter((item) => ids.includes(item.id)),
    }),
  }),
});

export const {
  useSearchTestimonialsLookupQuery,
  useGetTestimonialsByIdsQuery,
} = testimonialsLookupApi;

registerApi(testimonialsLookupApi);
