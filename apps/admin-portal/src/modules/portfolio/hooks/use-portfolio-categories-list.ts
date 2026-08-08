import type {
  PortfolioCategoryItem,
  PortfolioCategoryListQuery,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListPortfolioCategoriesQuery } from '../api/portfolio-categories.api';

interface UsePortfolioCategoriesListResult {
  list: UseListUrlStateResult;
  rows: PortfolioCategoryItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map the URL list state to the portfolio-categories query (no extra filters — search only). */
function buildCategoriesQuery(state: ListState): PortfolioCategoryListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
  };
}

/** Portfolio-categories list logic (U5): URL-sourced list state + the categories query. */
export function usePortfolioCategoriesList(): UsePortfolioCategoriesListResult {
  const list = useListUrlState();
  const { data, isLoading, isFetching, isError } =
    useListPortfolioCategoriesQuery(buildCategoriesQuery(list.state));

  return {
    list,
    rows: data?.items ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isFetching,
    isError,
  };
}
