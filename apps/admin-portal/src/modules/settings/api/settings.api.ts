import { createApi } from '@reduxjs/toolkit/query/react';
import type { SettingsCatalog, SettingsUpdateRequest } from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/**
 * Descriptor-driven settings endpoints. `getSettings` reads the whole catalog (groups →
 * sections → fields with descriptor + resolved value); `updateSettings` PUTs a batch of
 * typed key→value writes and publishes `settings.updated` (W4). The `Settings` tag refetch
 * re-baselines each section form from the server (the server returns the fresh catalog).
 */
export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getSettings: builder.query<SettingsCatalog, void>({
      query: () => ({ url: '/settings' }),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<SettingsCatalog, SettingsUpdateRequest>({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'settings.updated' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;

registerApi(settingsApi);
