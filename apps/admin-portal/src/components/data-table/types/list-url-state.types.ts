export type SortOrder = 'asc' | 'desc';

/** The list state, single-sourced in the URL by `useListUrlState`. */
export interface ListState {
  page: number;
  pageSize: number;
  search: string;
  sort: string | undefined;
  order: SortOrder;
  filters: Record<string, string>;
}

export interface UseListUrlStateResult {
  state: ListState;
  /** The immediate (un-debounced) search box value. */
  searchInput: string;
  setSearch: (term: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Toggle a column's sort (asc ↔ desc), or switch the sort column. */
  setSort: (key: string) => void;
  setFilter: (key: string, value: string | undefined) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}
