import type { TeamMemberItem, TeamMemberListQuery } from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListTeamQuery } from '../api/team.api';

interface UseTeamListResult {
  list: UseListUrlStateResult;
  rows: TeamMemberItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map URL list state to the team query; `featured` is the one whitelisted filter (N7). */
function buildTeamQuery(state: ListState): TeamMemberListQuery {
  const featured =
    state.filters.featured === 'true'
      ? true
      : state.filters.featured === 'false'
        ? false
        : undefined;
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
    ...(featured !== undefined ? { featured } : {}),
  };
}

/** Team list logic (U5): URL-sourced state + the team query. */
export function useTeamList(): UseTeamListResult {
  const list = useListUrlState({ filterKeys: ['featured'] });
  const { data, isLoading, isFetching, isError } = useListTeamQuery(
    buildTeamQuery(list.state),
  );

  return {
    list,
    rows: data?.items ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isFetching,
    isError,
  };
}
