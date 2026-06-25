import { createApi } from '@reduxjs/toolkit/query/react';
import type { BrandingRecord, BrandingUpdateRequest } from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/**
 * Branding endpoints. `getBranding` reads the fully-resolved record (public on the
 * gateway, but the portal sends its bearer anyway); `updateBranding` PUTs a deep-partial
 * and publishes `settings.branding.updated` (W4). The `Branding` tag invalidation refetches
 * the resolved record so the form re-baselines from the server.
 */
export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Branding'],
  endpoints: (builder) => ({
    getBranding: builder.query<BrandingRecord, void>({
      query: () => ({ url: '/branding' }),
      providesTags: ['Branding'],
    }),
    updateBranding: builder.mutation<BrandingRecord, BrandingUpdateRequest>({
      query: (body) => ({ url: '/branding', method: 'PUT', body }),
      invalidatesTags: ['Branding'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'settings.branding.updated' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const { useGetBrandingQuery, useUpdateBrandingMutation } = settingsApi;

registerApi(settingsApi);
