import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  AuthUser,
  ListQuery,
  Paginated,
  Role,
  UserCreateRequest,
  UserUpdateRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The PATCH body sent to `/identity/users/:id` — the update contract minus the path `id`. */
export type UserUpdateBody = Omit<UserUpdateRequest, 'id'>;

/**
 * Users + roles management api (W3). All writes are `identity.users.manage`-guarded at the
 * gateway. Every mutation invalidates the LIST tag and publishes `identity.user.changed` (W4)
 * so the dashboard "team members" count refetches.
 */
export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    listUsers: builder.query<Paginated<AuthUser>, ListQuery>({
      query: (params) => ({ url: '/identity/users', params }),
      providesTags: (result) => [
        { type: 'User', id: 'LIST' },
        ...(result?.items ?? []).map((user) => ({
          type: 'User' as const,
          id: user.id,
        })),
      ],
    }),
    createUser: builder.mutation<AuthUser, UserCreateRequest>({
      query: (body) => ({ url: '/identity/users', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'identity.user.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    updateUser: builder.mutation<
      AuthUser,
      { id: string; body: UserUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/identity/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'identity.user.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    assignUserRole: builder.mutation<AuthUser, { id: string; role: Role }>({
      query: ({ id, role }) => ({
        url: `/identity/users/${id}/roles`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'identity.user.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    revokeUserRole: builder.mutation<AuthUser, { id: string; role: Role }>({
      query: ({ id, role }) => ({
        url: `/identity/users/${id}/roles/${role}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'identity.user.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignUserRoleMutation,
  useRevokeUserRoleMutation,
} = usersApi;

registerApi(usersApi);
