import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  IntegrationCapability,
  IntegrationCapabilityStatus,
  IntegrationProviderId,
  IntegrationTestResult,
  IntegrationValues,
  StorageCorsStatus,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';

/**
 * Integrations endpoints (N13 — capability→providers→active). The envelope is unwrapped by
 * `baseQueryWithAuth`. Reads return the **masked** catalog (secrets only as `last4`).
 * `configure`/`activate` return the refreshed catalog, so the mutation's response replaces the
 * cache in one round-trip (no follow-up refetch). `test` is a probe — it changes nothing and
 * therefore invalidates nothing.
 */
export const integrationsApi = createApi({
  reducerPath: 'integrationsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Integration', 'StorageCors'],
  endpoints: (builder) => ({
    listIntegrations: builder.query<IntegrationCapabilityStatus[], void>({
      query: () => ({ url: '/integrations' }),
      providesTags: [{ type: 'Integration', id: 'LIST' }],
    }),
    configureProvider: builder.mutation<
      IntegrationCapabilityStatus[],
      {
        capability: IntegrationCapability;
        provider: IntegrationProviderId;
        values: IntegrationValues;
      }
    >({
      query: ({ capability, provider, values }) => ({
        url: `/integrations/${capability}/${provider}`,
        method: 'PUT',
        body: { values },
      }),
      invalidatesTags: [{ type: 'Integration', id: 'LIST' }],
    }),
    activateProvider: builder.mutation<
      IntegrationCapabilityStatus[],
      { capability: IntegrationCapability; provider: IntegrationProviderId }
    >({
      query: ({ capability, provider }) => ({
        url: `/integrations/${capability}/active`,
        method: 'PUT',
        body: { provider },
      }),
      invalidatesTags: [{ type: 'Integration', id: 'LIST' }],
    }),
    testProvider: builder.mutation<
      IntegrationTestResult,
      { capability: IntegrationCapability; provider: IntegrationProviderId }
    >({
      query: ({ capability, provider }) => ({
        url: `/integrations/${capability}/${provider}/test`,
        method: 'POST',
      }),
    }),
    /**
     * The bucket's browser-CORS state. A read (unlike `test`, which is a mutation-shaped probe)
     * because it is fetched on render: the owner must SEE that browser uploads are blocked
     * without having to press anything (U23) — that silence is what cost a debugging session.
     */
    storageCorsStatus: builder.query<
      StorageCorsStatus,
      { provider: IntegrationProviderId }
    >({
      query: ({ provider }) => ({
        url: `/integrations/storage/${provider}/cors`,
      }),
      providesTags: (_result, _error, { provider }) => [
        { type: 'StorageCors', id: provider },
      ],
    }),
    /**
     * Write the policy. The backend re-READS the bucket after writing, so the response IS the
     * observed new state — patch it straight into the query cache instead of invalidating
     * (which would spend a second round-trip to learn what we were just told).
     */
    applyStorageCors: builder.mutation<
      StorageCorsStatus,
      { provider: IntegrationProviderId }
    >({
      query: ({ provider }) => ({
        url: `/integrations/storage/${provider}/cors`,
        method: 'POST',
      }),
      onQueryStarted: async ({ provider }, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(
          integrationsApi.util.updateQueryData(
            'storageCorsStatus',
            { provider },
            () => data,
          ),
        );
      },
    }),
  }),
});

export const {
  useListIntegrationsQuery,
  useConfigureProviderMutation,
  useActivateProviderMutation,
  useTestProviderMutation,
  useStorageCorsStatusQuery,
  useApplyStorageCorsMutation,
} = integrationsApi;

registerApi(integrationsApi);
