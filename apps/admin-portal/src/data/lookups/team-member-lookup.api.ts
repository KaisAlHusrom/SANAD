import { createApi } from '@reduxjs/toolkit/query/react';
import type { Paginated, TeamMemberItem } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface TeamMemberSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/** How many team members to fetch when resolving selected ids (a small, bounded set). */
const RESOLVE_PAGE_SIZE = 100;

/**
 * A shared, read-only team-member bridge for the blog post form's author ServerSelect (W5) — the
 * picker consumes THIS, never `modules/team/api` directly. A blog post's `authorTeamMemberId`
 * references a content `team_member` (not an identity user), so the author is chosen from the
 * public team list.
 *
 * `GET /content/team` returns a `Paginated<TeamMemberItem>` with server-side `search`/`page`.
 * There is no by-id route, so resolving the selected author id (to render the saved value's name,
 * pinned first) fetches a large page and filters client-side — the folder-lookup pattern, fine
 * for a bounded team set.
 */
export const teamMemberLookupApi = createApi({
  reducerPath: 'teamMemberLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchTeamMemberLookup: builder.query<
      Paginated<TeamMemberItem>,
      TeamMemberSearchArg
    >({
      query: ({ search, page, pageSize }) => ({
        url: '/content/team',
        params: {
          page,
          pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }),
    }),
    getTeamMembersByIds: builder.query<TeamMemberItem[], string[]>({
      query: () => ({
        url: '/content/team',
        params: { page: 1, pageSize: RESOLVE_PAGE_SIZE },
      }),
      transformResponse: (
        res: Paginated<TeamMemberItem>,
        _meta,
        ids: string[],
      ): TeamMemberItem[] =>
        res.items.filter((member) => ids.includes(member.id)),
    }),
  }),
});

export const { useSearchTeamMemberLookupQuery, useGetTeamMembersByIdsQuery } =
  teamMemberLookupApi;

registerApi(teamMemberLookupApi);
