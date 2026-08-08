import type { AuthUser, ListQuery } from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListUsersQuery } from '../api/users.api';

interface UseUsersListResult {
  list: UseListUrlStateResult;
  rows: AuthUser[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map the URL list state to the user list query (search-only; the backend whitelists it, N7). */
function buildUsersQuery(state: ListState): ListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(state.search ? { search: state.search } : {}),
  };
}

/** Users list logic (U5): URL-sourced state + the users query; the page stays presentational. */
export function useUsersList(): UseUsersListResult {
  const list = useListUrlState();
  const { data, isLoading, isFetching, isError } = useListUsersQuery(
    buildUsersQuery(list.state),
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
