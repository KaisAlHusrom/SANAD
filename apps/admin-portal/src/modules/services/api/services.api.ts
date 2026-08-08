import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Paginated,
  ReorderRequest,
  ServiceCreateRequest,
  ServiceItem,
  ServiceListQuery,
  ServiceUpdateRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/services/:id` — the contract minus the path `id`. */
export type ServiceUpdateBody = Omit<ServiceUpdateRequest, 'id'>;

/**
 * Services CMS api (W3). Admin reads the public list (services have no draft state); writes
 * are `content.manage`-guarded at the gateway. Each mutation publishes
 * `content.service.changed` so cross-module views (the page builder, dashboard) refetch (W4).
 */
export const servicesApi = createApi({
  reducerPath: 'servicesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Service'],
  endpoints: (builder) => ({
    listServices: builder.query<Paginated<ServiceItem>, ServiceListQuery>({
      query: (params) => ({ url: '/content/services', params }),
      providesTags: (result) => [
        { type: 'Service', id: 'LIST' },
        ...(result?.items ?? []).map((service) => ({
          type: 'Service' as const,
          id: service.id,
        })),
      ],
    }),
    createService: builder.mutation<ServiceItem, ServiceCreateRequest>({
      query: (body) => ({ url: '/content/services', method: 'POST', body }),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.service.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateService: builder.mutation<
      ServiceItem,
      { id: string; body: ServiceUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/services/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Service', id },
        { type: 'Service', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.service.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderServices: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/services/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.service.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteService: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/services/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Service', id },
        { type: 'Service', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.service.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useReorderServicesMutation,
  useDeleteServiceMutation,
} = servicesApi;

registerApi(servicesApi);
