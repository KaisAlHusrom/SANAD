import {
  serviceCategorySchema,
  type ServiceItem,
  type ServiceListQuery,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListServicesQuery } from '../api/services.api';

interface UseServicesListResult {
  list: UseListUrlStateResult;
  rows: ServiceItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map the URL list state to the whitelisted services query (N7 — category validated). */
function buildServicesQuery(state: ListState): ServiceListQuery {
  const category = serviceCategorySchema.safeParse(state.filters.category);
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
    ...(category.success ? { category: category.data } : {}),
  };
}

/**
 * Services list logic (U5): URL-sourced list state + the services query; the page stays
 * presentational. The `category` filter is the only whitelisted filter (N7).
 */
export function useServicesList(): UseServicesListResult {
  const list = useListUrlState({ filterKeys: ['category'] });
  const { data, isLoading, isFetching, isError } = useListServicesQuery(
    buildServicesQuery(list.state),
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
