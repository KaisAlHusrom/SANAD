import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Paginated,
  ReorderRequest,
  TestimonialCreateRequest,
  TestimonialItem,
  TestimonialListQuery,
  TestimonialUpdateRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/testimonials/:id` — the contract minus the path `id`. */
export type TestimonialUpdateBody = Omit<TestimonialUpdateRequest, 'id'>;

/**
 * Testimonials CMS api (W3). List-only collection (no slug); admin reads the public list.
 * Writes are `content.manage`-guarded; each mutation publishes `content.testimonial.changed`
 * (W4). The inline `featured` toggle (W6) PATCHes a partial `{ featured }` body.
 */
export const testimonialsApi = createApi({
  reducerPath: 'testimonialsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Testimonial'],
  endpoints: (builder) => ({
    listTestimonials: builder.query<
      Paginated<TestimonialItem>,
      TestimonialListQuery
    >({
      query: (params) => ({ url: '/content/testimonials', params }),
      providesTags: (result) => [
        { type: 'Testimonial', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({
          type: 'Testimonial' as const,
          id: item.id,
        })),
      ],
    }),
    createTestimonial: builder.mutation<
      TestimonialItem,
      TestimonialCreateRequest
    >({
      query: (body) => ({
        url: '/content/testimonials',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Testimonial', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.testimonial.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateTestimonial: builder.mutation<
      TestimonialItem,
      { id: string; body: TestimonialUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/testimonials/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Testimonial', id },
        { type: 'Testimonial', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.testimonial.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderTestimonials: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/testimonials/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Testimonial', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.testimonial.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteTestimonial: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/testimonials/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Testimonial', id },
        { type: 'Testimonial', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.testimonial.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListTestimonialsQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useReorderTestimonialsMutation,
  useDeleteTestimonialMutation,
} = testimonialsApi;

registerApi(testimonialsApi);
