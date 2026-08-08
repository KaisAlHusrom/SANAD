import { createApi } from '@reduxjs/toolkit/query/react';
import type { BlogPostItem, Paginated } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface BlogSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many posts to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only blog bridge for the section collection panel's `picked`-ids ServerSelect (W5)
 * — the picker consumes THIS, never the `modules/blog` api directly. A `blog` section's `config.ids`
 * reference content `blog_post` records, chosen from the PUBLIC (published-only) list — the hydrator
 * forces `published` on the public path, so a picked draft would be hidden anyway. Posts have a
 * translatable `title` (localized at the call site with `pickLocalized`).
 *
 * `GET /content/blog` returns a `Paginated<BlogPostItem>` with server-side `search`/`page`. There is
 * no public by-id route, so resolving the selected ids fetches a large page and filters client-side
 * — the service-lookup pattern, fine for a bounded set.
 */
export const blogLookupApi = createApi({
  reducerPath: 'blogLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchBlogLookup: builder.query<Paginated<BlogPostItem>, BlogSearchArg>({
      query: ({ search, page, pageSize }) => ({
        url: '/content/blog',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getBlogByIds: builder.query<BlogPostItem[], string[]>({
      query: () => ({
        url: '/content/blog',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<BlogPostItem>,
        _meta,
        ids: string[],
      ): BlogPostItem[] => res.items.filter((post) => ids.includes(post.id)),
    }),
  }),
});

export const { useSearchBlogLookupQuery, useGetBlogByIdsQuery } = blogLookupApi;

registerApi(blogLookupApi);
