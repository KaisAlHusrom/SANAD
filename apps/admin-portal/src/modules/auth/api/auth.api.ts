import {
  type AuthResult,
  type IdentityContext,
  type LoginRequest,
  type LogoutResult,
} from '@sanad/contracts';
import { createApi } from '@reduxjs/toolkit/query/react';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import {
  identityLoaded,
  loggedOut,
  tokensReceived,
} from '../../../data/auth/auth.slice';
import { eventBus } from '../../../data/events/event-bus';

/**
 * Auth endpoints. The envelope is unwrapped by `baseQueryWithAuth`; refresh is NOT an
 * endpoint here — it lives inside the base query (F1, one place). Mutations publish a
 * domain event after success (W4).
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResult, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokensReceived(data.tokens));
          eventBus.publish({ type: 'auth.loggedIn', userId: data.user.id });
        } catch {
          // Login failed — the caller surfaces the error via `.unwrap()`.
        }
      },
    }),
    logout: builder.mutation<LogoutResult, { refresh: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Local session is cleared regardless of the server result.
          dispatch(loggedOut());
          eventBus.publish({ type: 'auth.loggedOut' });
        }
      },
    }),
    me: builder.query<IdentityContext, void>({
      query: () => ({ url: '/auth/me' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(identityLoaded(data));
        } catch {
          // A failed /me (e.g. session gone) is handled by the auth guard.
        }
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useMeQuery } = authApi;

registerApi(authApi);
