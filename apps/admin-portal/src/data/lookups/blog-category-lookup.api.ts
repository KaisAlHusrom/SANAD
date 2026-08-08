import { createApi } from '@reduxjs/toolkit/query/react';
import type { BlogCategoryItem, Paginated } from '@sanad/contracts';
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
 * A shared, read-only blog-category bridge for the post form's category ServerSelect (W5) — the
 * picker consumes THIS, never `modules/blog/api` directly. Its own reducerPath keeps the picker
 * cache decoupled from the categories module's own list cache.
 *
 * `GET /content/blog-categories` returns a `Paginated<BlogCategoryItem>` and supports server-side
 * `search`/`page`. There is no by-id route, so resolving already-selected ids (to render a saved
 * value's label, pinned first) fetches a large page and filters client-side — the folder-lookup
 * pattern, fine for a bounded category set.
 */
export const blogCategoryLookupApi = createApi({
  reducerPath: 'blogCategoryLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchBlogCategoryLookup: builder.query<
      Paginated<BlogCategoryItem>,
      CategorySearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/blog-categories',
        // `search` is `.min(1)` at the gateway — omit it when blank (an empty box browses all).
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getBlogCategoriesByIds: builder.query<BlogCategoryItem[], string[]>({
      query: () => ({
        url: '/content/blog-categories',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<BlogCategoryItem>,
        _meta,
        ids: string[],
      ): BlogCategoryItem[] =>
        res.items.filter((category) => ids.includes(category.id)),
    }),
  }),
});

export const {
  useSearchBlogCategoryLookupQuery,
  useGetBlogCategoriesByIdsQuery,
} = blogCategoryLookupApi;

registerApi(blogCategoryLookupApi);
