import {
  booleanParamSchema,
  portfolioStatusSchema,
  type PortfolioListQuery,
  type PortfolioProjectItem,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListPortfolioQuery } from '../api/portfolio.api';

interface UsePortfolioListResult {
  list: UseListUrlStateResult;
  rows: PortfolioProjectItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/**
 * Map the URL list state to the whitelisted portfolio query (N7 — `status`/`featured`
 * validated). Reads the draft-visible admin list (`/content/portfolio/manage`).
 */
function buildPortfolioQuery(state: ListState): PortfolioListQuery {
  const status = portfolioStatusSchema.safeParse(state.filters.status);
  const featured = booleanParamSchema.safeParse(state.filters.featured);
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(featured.success ? { featured: featured.data } : {}),
  };
}

/**
 * Portfolio-projects list logic (U5): URL-sourced list state + the admin query; the page stays
 * presentational. `status` and `featured` are the whitelisted filters (N7).
 */
export function usePortfolioList(): UsePortfolioListResult {
  const list = useListUrlState({ filterKeys: ['status', 'featured'] });
  const { data, isLoading, isFetching, isError } = useListPortfolioQuery(
    buildPortfolioQuery(list.state),
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
