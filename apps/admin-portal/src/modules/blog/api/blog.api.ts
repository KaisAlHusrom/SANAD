import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  BlogPostCreateRequest,
  BlogPostItem,
  BlogPostListQuery,
  BlogPostUpdateRequest,
  Paginated,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/blog/:id` — the contract minus the path `id`. */
export type BlogPostUpdateBody = Omit<BlogPostUpdateRequest, 'id'>;

/**
 * Blog posts CMS api (W3). The admin list reads `/content/blog/manage` (the draft-visible route —
 * the public `/content/blog` forces `status=published`); writes are `content.manage`-guarded at
 * the gateway. Each mutation publishes `content.blog.changed` (W4). The inline `status` toggle
 * (W6) PATCHes a partial body.
 */
export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['BlogPost'],
  endpoints: (builder) => ({
    listBlog: builder.query<Paginated<BlogPostItem>, BlogPostListQuery>({
      query: (params) => ({ url: '/content/blog/manage', params }),
      providesTags: (result) => [
        { type: 'BlogPost', id: 'LIST' },
        ...(result?.items ?? []).map((post) => ({
          type: 'BlogPost' as const,
          id: post.id,
        })),
      ],
    }),
    getBlogPost: builder.query<BlogPostItem, string>({
      query: (id) => ({ url: `/content/blog/manage/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'BlogPost', id }],
    }),
    createBlog: builder.mutation<BlogPostItem, BlogPostCreateRequest>({
      query: (body) => ({ url: '/content/blog', method: 'POST', body }),
      invalidatesTags: [{ type: 'BlogPost', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateBlog: builder.mutation<
      BlogPostItem,
      { id: string; body: BlogPostUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/blog/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'BlogPost', id },
        { type: 'BlogPost', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteBlog: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/blog/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'BlogPost', id },
        { type: 'BlogPost', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.blog.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListBlogQuery,
  useGetBlogPostQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogApi;

registerApi(blogApi);
