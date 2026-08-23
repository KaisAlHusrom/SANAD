import {
  leadSourceSchema,
  leadSpamVerdictSchema,
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
 * Map the URL list state to the whitelisted leads query (N7 — status, source and spam are each
 * re-validated against the contract before they leave). Defaults to newest-first (the base repo
 * otherwise orders by id); once the user sorts a column, their choice wins.
 */
function buildLeadsQuery(state: ListState): LeadListQuery {
  const status = leadStatusSchema.safeParse(state.filters.status);
  const source = leadSourceSchema.safeParse(state.filters.source);
  const spam = leadSpamVerdictSchema.safeParse(state.filters.spam);
  return {
    page: state.page,
    pageSize: state.pageSize,
    sort: state.sort ?? 'createdAt',
    order: state.sort ? state.order : 'desc',
    ...(state.search ? { search: state.search } : {}),
    ...(status.success ? { status: status.data } : {}),
    ...(source.success ? { source: source.data } : {}),
    ...(spam.success ? { spam: spam.data } : {}),
  };
}

/**
 * Leads-inbox list logic (U5): URL-sourced list state + the leads query; the page stays
 * presentational. `status`, `source` and `spam` are the whitelisted filters (N7) — a key missing
 * from this list would also survive "clear all", which only clears what it was told about.
 */
export function useLeadsList(): UseLeadsListResult {
  const list = useListUrlState({ filterKeys: ['status', 'source', 'spam'] });
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
