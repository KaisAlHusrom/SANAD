import type { ListQuery, PageSummary } from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListPagesQuery } from '../api/pages.api';

interface UsePagesListResult {
  list: UseListUrlStateResult;
  rows: PageSummary[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map the URL list state to the page list query (defaults to the drag-reorder order). */
function buildPagesQuery(state: ListState): ListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
  };
}

/**
 * Pages list logic (U5): URL-sourced list state + the admin list query; the page stays
 * presentational. Pages have no whitelisted filters (just search + order + reorder).
 */
export function usePagesList(): UsePagesListResult {
  const list = useListUrlState({ filterKeys: [] });
  const { data, isLoading, isFetching, isError } = useListPagesQuery(
    buildPagesQuery(list.state),
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
