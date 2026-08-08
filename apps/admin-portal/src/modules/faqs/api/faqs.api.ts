import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  FaqCreateRequest,
  FaqItem,
  FaqListQuery,
  FaqUpdateRequest,
  Paginated,
  ReorderRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/faqs/:id` — the contract minus the path `id`. */
export type FaqUpdateBody = Omit<FaqUpdateRequest, 'id'>;

/**
 * FAQs CMS api (W3). List-only collection (no slug), grouped by an optional `category` enum.
 * Writes are `content.manage`-guarded; each mutation publishes `content.faq.changed` (W4).
 */
export const faqsApi = createApi({
  reducerPath: 'faqsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Faq'],
  endpoints: (builder) => ({
    listFaqs: builder.query<Paginated<FaqItem>, FaqListQuery>({
      query: (params) => ({ url: '/content/faqs', params }),
      providesTags: (result) => [
        { type: 'Faq', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({
          type: 'Faq' as const,
          id: item.id,
        })),
      ],
    }),
    createFaq: builder.mutation<FaqItem, FaqCreateRequest>({
      query: (body) => ({ url: '/content/faqs', method: 'POST', body }),
      invalidatesTags: [{ type: 'Faq', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.faq.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateFaq: builder.mutation<FaqItem, { id: string; body: FaqUpdateBody }>({
      query: ({ id, body }) => ({
        url: `/content/faqs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Faq', id },
        { type: 'Faq', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.faq.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderFaqs: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/faqs/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Faq', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.faq.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteFaq: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/faqs/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Faq', id },
        { type: 'Faq', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.faq.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useReorderFaqsMutation,
  useDeleteFaqMutation,
} = faqsApi;

registerApi(faqsApi);
