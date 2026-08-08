import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Paginated,
  PortfolioCategoryCreateRequest,
  PortfolioCategoryItem,
  PortfolioCategoryListQuery,
  PortfolioCategoryUpdateRequest,
  ReorderRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/portfolio-categories/:id` — the contract minus `id`. */
export type PortfolioCategoryUpdateBody = Omit<
  PortfolioCategoryUpdateRequest,
  'id'
>;

/**
 * Portfolio categories CMS api (W3) — the project taxonomy managed from the categories
 * sub-page. Reads the public `/content/portfolio-categories` list; writes are
 * `content.manage`-guarded. Each mutation publishes `content.portfolio-category.changed` (W4)
 * so the project form's category ServerSelect refetches.
 */
export const portfolioCategoriesApi = createApi({
  reducerPath: 'portfolioCategoriesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['PortfolioCategory'],
  endpoints: (builder) => ({
    listPortfolioCategories: builder.query<
      Paginated<PortfolioCategoryItem>,
      PortfolioCategoryListQuery
    >({
      query: (params) => ({ url: '/content/portfolio-categories', params }),
      providesTags: (result) => [
        { type: 'PortfolioCategory', id: 'LIST' },
        ...(result?.items ?? []).map((category) => ({
          type: 'PortfolioCategory' as const,
          id: category.id,
        })),
      ],
    }),
    createPortfolioCategory: builder.mutation<
      PortfolioCategoryItem,
      PortfolioCategoryCreateRequest
    >({
      query: (body) => ({
        url: '/content/portfolio-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'PortfolioCategory', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updatePortfolioCategory: builder.mutation<
      PortfolioCategoryItem,
      { id: string; body: PortfolioCategoryUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/portfolio-categories/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PortfolioCategory', id },
        { type: 'PortfolioCategory', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderPortfolioCategories: builder.mutation<
      ReorderRequest,
      ReorderRequest
    >({
      query: (body) => ({
        url: '/content/portfolio-categories/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'PortfolioCategory', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deletePortfolioCategory: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/content/portfolio-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PortfolioCategory', id },
        { type: 'PortfolioCategory', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.portfolio-category.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListPortfolioCategoriesQuery,
  useCreatePortfolioCategoryMutation,
  useUpdatePortfolioCategoryMutation,
  useReorderPortfolioCategoriesMutation,
  useDeletePortfolioCategoryMutation,
} = portfolioCategoriesApi;

registerApi(portfolioCategoriesApi);
