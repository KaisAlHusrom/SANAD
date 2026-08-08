import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Paginated,
  ReorderRequest,
  TeamMemberCreateRequest,
  TeamMemberItem,
  TeamMemberListQuery,
  TeamMemberUpdateRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** The update body PATCHed to `/content/team/:id` — the contract minus the path `id`. */
export type TeamMemberUpdateBody = Omit<TeamMemberUpdateRequest, 'id'>;

/**
 * Team CMS api (W3). Admin reads the public list (no draft state); writes are
 * `content.manage`-guarded; each mutation publishes `content.team-member.changed` (W4). The
 * inline `featured` toggle (W6) PATCHes a partial `{ featured }` body.
 */
export const teamApi = createApi({
  reducerPath: 'teamApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['TeamMember'],
  endpoints: (builder) => ({
    listTeam: builder.query<Paginated<TeamMemberItem>, TeamMemberListQuery>({
      query: (params) => ({ url: '/content/team', params }),
      providesTags: (result) => [
        { type: 'TeamMember', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({
          type: 'TeamMember' as const,
          id: item.id,
        })),
      ],
    }),
    createTeamMember: builder.mutation<TeamMemberItem, TeamMemberCreateRequest>(
      {
        query: (body) => ({ url: '/content/team', method: 'POST', body }),
        invalidatesTags: [{ type: 'TeamMember', id: 'LIST' }],
        async onQueryStarted(_arg, { queryFulfilled }) {
          try {
            await queryFulfilled;
            eventBus.publish({ type: 'content.team-member.changed' });
          } catch {
            // surfaced to the caller via `.unwrap()`
          }
        },
      },
    ),
    updateTeamMember: builder.mutation<
      TeamMemberItem,
      { id: string; body: TeamMemberUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `/content/team/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'TeamMember', id },
        { type: 'TeamMember', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.team-member.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    reorderTeam: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/team/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'TeamMember', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.team-member.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    deleteTeamMember: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/content/team/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'TeamMember', id },
        { type: 'TeamMember', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'content.team-member.changed' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useListTeamQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useReorderTeamMutation,
  useDeleteTeamMemberMutation,
} = teamApi;

registerApi(teamApi);
