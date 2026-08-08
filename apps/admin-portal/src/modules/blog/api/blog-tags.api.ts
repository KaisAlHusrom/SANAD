import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  BlogTagCreateRequest,
  BlogTagItem,
  BlogTagListQuery,
  BlogTagUpdateRequest,
  Paginated,
  ReorderRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/blog-tags/:id` — the contract minus `id`. */
export type BlogTagUpdateBody = Omit<BlogTagUpdateRequest, 'id'>;

/**
 * Blog tags CMS api (W3) — the post tag set managed from the tags sub-page. Reads the public
 * `/content/blog-tags` list; writes are `content.manage`-guarded. Each mutation publishes
 * `content.blog-tag.changed` (W4) so the post form's multi-tag ServerSelect refetches.
 */
export const blogTagsApi = createApi({
  reducerPath: 'blogTagsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['BlogTag'],
  endpoints: (builder) => ({
    listBlogTags: builder.query<Paginated<BlogTagItem>, BlogTagListQuery>({
      query: (params) => ({ url: '/content/blog-tags', params }),
      providesTags: (result) => [
        { type: 'BlogTag', id: 'LIST' },
        ...(result?.items ?? []).map((tag) => ({
          type: 'BlogTag' as const,
          id: tag.id,
        })),
      ],
    }),
    createBlogTag: builder.mutation<BlogTagItem, BlogTagCreateRequest>({
      query: (body) => ({ url: '/content/blog-tags', method: 'POST', body }),
      invalidatesTags: [{ type: 'BlogTag', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-tag.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateBlogTag: builder.mutation<
      BlogTagItem,
      { id: string; body: BlogTagUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/blog-tags/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'BlogTag', id },
        { type: 'BlogTag', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-tag.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderBlogTags: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/blog-tags/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'BlogTag', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-tag.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteBlogTag: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/blog-tags/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'BlogTag', id },
        { type: 'BlogTag', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog-tag.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListBlogTagsQuery,
  useCreateBlogTagMutation,
  useUpdateBlogTagMutation,
  useReorderBlogTagsMutation,
  useDeleteBlogTagMutation,
} = blogTagsApi;

registerApi(blogTagsApi);
