import { createApi } from '@reduxjs/toolkit/query/react';
import type { SecretKey, SecretStatus } from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';

/**
 * Integration-secret endpoints (N13). The envelope is unwrapped by `baseQueryWithAuth`.
 * Reads list the **masked** statuses; `setSecret` rotates one secret and the row refreshes
 * via RTK tag invalidation (no domain event — no other module reacts to a secret change,
 * W4). The plaintext `value` is write-only and never returned.
 */
export const integrationSecretsApi = createApi({
  reducerPath: 'integrationSecretsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Secret'],
  endpoints: (builder) => ({
    listSecrets: builder.query<SecretStatus[], void>({
      query: () => ({ url: '/integration-secrets' }),
      providesTags: (result) => [
        { type: 'Secret', id: 'LIST' },
        ...(result ?? []).map((status) => ({
          type: 'Secret' as const,
          id: status.key,
        })),
      ],
    }),
    setSecret: builder.mutation<
      SecretStatus,
      { key: SecretKey; value: string }
    >({
      query: ({ key, value }) => ({
        url: `/integration-secrets/${key}`,
        method: 'PUT',
        body: { value },
      }),
      invalidatesTags: (_result, _error, { key }) => [
        { type: 'Secret', id: 'LIST' },
        { type: 'Secret', id: key },
      ],
    }),
  }),
});

export const { useListSecretsQuery, useSetSecretMutation } =
  integrationSecretsApi;

registerApi(integrationSecretsApi);
