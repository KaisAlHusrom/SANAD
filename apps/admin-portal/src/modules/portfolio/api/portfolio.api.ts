import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Paginated,
  PortfolioCreateRequest,
  PortfolioListQuery,
  PortfolioProjectItem,
  PortfolioUpdateRequest,
  ReorderRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/portfolio/:id` — the contract minus the path `id`. */
export type PortfolioUpdateBody = Omit<PortfolioUpdateRequest, 'id'>;

/**
 * Portfolio projects CMS api (W3). The admin list reads `/content/portfolio/manage` (the
 * draft-visible route — the public `/content/portfolio` forces `status=published`); writes are
 * `content.manage`-guarded at the gateway. Each mutation publishes `content.portfolio.changed`
 * (W4). The inline `status`/`featured` toggles (W6) PATCH a partial body.
 */
export const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['PortfolioProject'],
  endpoints: (builder) => ({
    listPortfolio: builder.query<
      Paginated<PortfolioProjectItem>,
      PortfolioListQuery
    >({
      query: (params) => ({ url: '/content/portfolio/manage', params }),
      providesTags: (result) => [
        { type: 'PortfolioProject', id: 'LIST' },
        ...(result?.items ?? []).map((project) => ({
          type: 'PortfolioProject' as const,
          id: project.id,
        })),
      ],
    }),
    createPortfolio: builder.mutation<
      PortfolioProjectItem,
      PortfolioCreateRequest
    >({
      query: (body) => ({ url: '/content/portfolio', method: 'POST', body }),
      invalidatesTags: [{ type: 'PortfolioProject', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updatePortfolio: builder.mutation<
      PortfolioProjectItem,
      { id: string; body: PortfolioUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/portfolio/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PortfolioProject', id },
        { type: 'PortfolioProject', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderPortfolio: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/portfolio/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'PortfolioProject', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deletePortfolio: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/portfolio/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PortfolioProject', id },
        { type: 'PortfolioProject', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListPortfolioQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useReorderPortfolioMutation,
  useDeletePortfolioMutation,
} = portfolioApi;

registerApi(portfolioApi);
