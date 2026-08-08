import {
  leadSourceSchema,
  leadStatusSchema,
  type Lead,
  type LeadListQuery,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListLeadsQuery } from '../api/leads.api';

interface UseLeadsListResult {
  list: UseListUrlStateResult;
  rows: Lead[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/**
 * Map the URL list state to the whitelisted leads query (N7 — status + source validated).
 * Defaults to newest-first (the base repo otherwise orders by id); once the user sorts a
 * column, their choice wins.
 */
function buildLeadsQuery(state: ListState): LeadListQuery {
  const status = leadStatusSchema.safeParse(state.filters.status);
  const source = leadSourceSchema.safeParse(state.filters.source);
  return {
    page: state.page,
    pageSize: state.pageSize,
    sort: state.sort ?? 'createdAt',
    order: state.sort ? state.order : 'desc',
    ...(state.search ? { search: state.search } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(source.success ? { source: source.data } : {}),
  };
}

/**
 * Leads-inbox list logic (U5): URL-sourced list state + the leads query; the page stays
 * presentational. `status` and `source` are the whitelisted filters (N7).
 */
export function useLeadsList(): UseLeadsListResult {
  const list = useListUrlState({ filterKeys: ['status', 'source'] });
  const { data, isLoading, isFetching, isError } = useListLeadsQuery(
    buildLeadsQuery(list.state),
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
