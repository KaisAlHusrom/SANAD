import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  BlogCategoryCreateRequest,
  BlogCategoryItem,
  BlogCategoryListQuery,
  BlogCategoryUpdateRequest,
  Paginated,
  ReorderRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/blog-categories/:id` — the contract minus `id`. */
export type BlogCategoryUpdateBody = Omit<BlogCategoryUpdateRequest, 'id'>;

/**
 * Blog categories CMS api (W3) — the post taxonomy managed from the categories sub-page. Reads
 * the public `/content/blog-categories` list; writes are `content.manage`-guarded. Each mutation
 * publishes `content.blog-category.changed` (W4) so the post form's category ServerSelect refetches.
 */
export const blogCategoriesApi = createApi({
  reducerPath: 'blogCategoriesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['BlogCategory'],
  endpoints: (builder) => ({
    listBlogCategories: builder.query<
      Paginated<BlogCategoryItem>,
      BlogCategoryListQuery
    >({
      query: (params) => ({ url: '/content/blog-categories', params }),
      providesTags: (result) => [
        { type: 'BlogCategory', id: 'LIST' },
        ...(result?.items ?? []).map((category) => ({
          type: 'BlogCategory' as const,
          id: category.id,
        })),
      ],
    }),
    createBlogCategory: builder.mutation<
      BlogCategoryItem,
      BlogCategoryCreateRequest
    >({
      query: (body) => ({
        url: '/content/blog-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BlogCategory', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateBlogCategory: builder.mutation<
      BlogCategoryItem,
      { id: string; body: BlogCategoryUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/blog-categories/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'BlogCategory', id },
        { type: 'BlogCategory', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderBlogCategories: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/blog-categories/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'BlogCategory', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteBlogCategory: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/content/blog-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'BlogCategory', id },
        { type: 'BlogCategory', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useReorderBlogCategoriesMutation,
  useDeleteBlogCategoryMutation,
} = blogCategoriesApi;

registerApi(blogCategoriesApi);
