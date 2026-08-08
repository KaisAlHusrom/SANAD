import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Lead,
  LeadListQuery,
  LeadStatus,
  Paginated,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/**
 * Leads-inbox api (W3). The list + status update are `content.manage`-guarded at the gateway
 * (the public submit lives on the website). A status change invalidates the LIST tag and
 * publishes `lead.updated` (W4) so the dashboard refetches its counts + recent leads.
 */
export const leadsApi = createApi({
  reducerPath: 'leadsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Lead'],
  endpoints: (builder) => ({
    listLeads: builder.query<Paginated<Lead>, LeadListQuery>({
      query: (params) => ({ url: '/leads', params }),
      providesTags: (result) => [
        { type: 'Lead', id: 'LIST' },
        ...(result?.items ?? []).map((lead) => ({
          type: 'Lead' as const,
          id: lead.id,
        })),
      ],
    }),
    updateLeadStatus: builder.mutation<
      Lead,
      { id: string; status: LeadStatus }
    >({
      query: ({ id, status }) => ({
        url: `/leads/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lead', id },
        { type: 'Lead', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'lead.updated' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const { useListLeadsQuery, useUpdateLeadStatusMutation } = leadsApi;

registerApi(leadsApi);
