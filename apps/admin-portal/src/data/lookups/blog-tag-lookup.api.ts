import { createApi } from '@reduxjs/toolkit/query/react';
import type { BlogTagItem, Paginated } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface TagSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many tags to fetch when resolving selected ids (a small, bounded lookup set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only blog-tag bridge for the post form's **multi** tags ServerSelect (W5) — the
 * picker consumes THIS, never `modules/blog/api` directly. Its own reducerPath keeps the picker
 * cache decoupled from the tags module's own list cache.
 *
 * `GET /content/blog-tags` returns a `Paginated<BlogTagItem>` with server-side `search`/`page`.
 * There is no by-id route, so resolving the already-selected tag ids (each rendered as a chip,
 * pinned first) fetches a large page and filters client-side — the folder-lookup pattern, fine
 * for a bounded tag set.
 */
export const blogTagLookupApi = createApi({
  reducerPath: 'blogTagLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchBlogTagLookup: builder.query<Paginated<BlogTagItem>, TagSearchArg>({
      query: ({ search, page, pageSize }) => ({
        url: '/content/blog-tags',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getBlogTagsByIds: builder.query<BlogTagItem[], string[]>({
      query: () => ({
        url: '/content/blog-tags',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<BlogTagItem>,
        _meta,
        ids: string[],
      ): BlogTagItem[] => res.items.filter((tag) => ids.includes(tag.id)),
    }),
  }),
});

export const { useSearchBlogTagLookupQuery, useGetBlogTagsByIdsQuery } =
  blogTagLookupApi;

registerApi(blogTagLookupApi);
