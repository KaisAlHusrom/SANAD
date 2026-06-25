import { DEFAULT_PAGE_SIZE } from '@sanad/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  ListState,
  SortOrder,
  UseListUrlStateResult,
} from '../components/data-table/types';
import { useDebouncedValue } from './use-debounced-value';

interface UseListUrlStateOptions {
  /** The whitelisted filter param keys this list tracks in the URL (N7). */
  filterKeys?: string[];
  defaultPageSize?: number;
  searchDebounce?: number;
}

const DEFAULT_DEBOUNCE = 300;

/**
 * Single-sources list state in the URL (`?page&pageSize&sort&order&search&<filterKeys>`):
 * shareable + back/forward-correct, no Redux. Search is debounced into the URL; any
 * search / filter / page-size change resets to page 1. The URL is the only source of
 * truth (the first `useSearchParams` consumer in the app).
 */
export function useListUrlState(
  options: UseListUrlStateOptions = {},
): UseListUrlStateResult {
  const {
    filterKeys = [],
    defaultPageSize = DEFAULT_PAGE_SIZE,
    searchDebounce = DEFAULT_DEBOUNCE,
  } = options;
  const [params, setParams] = useSearchParams();

  const urlSearch = params.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, searchDebounce);

  // One atomic write per change → no double history entries (copy → mutate → commit).
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  // Commit the debounced search to the URL and reset to page 1 (only when it differs).
  useEffect(() => {
    if (debouncedSearch === urlSearch) {
      return;
    }
    update((next) => {
      if (debouncedSearch) {
        next.set('search', debouncedSearch);
      } else {
        next.delete('search');
      }
      next.delete('page');
    });
  }, [debouncedSearch, urlSearch, update]);

  const setSearch = useCallback((term: string) => setSearchInput(term), []);

  const setPage = useCallback(
    (page: number) =>
      update((next) => {
        if (page > 1) {
          next.set('page', String(page));
        } else {
          next.delete('page');
        }
      }),
    [update],
  );

  const setPageSize = useCallback(
    (pageSize: number) =>
      update((next) => {
        if (pageSize === defaultPageSize) {
          next.delete('pageSize');
        } else {
          next.set('pageSize', String(pageSize));
        }
        next.delete('page');
      }),
    [update, defaultPageSize],
  );

  const setSort = useCallback(
    (key: string) =>
      update((next) => {
        const currentSort = next.get('sort');
        const currentOrder = next.get('order') === 'desc' ? 'desc' : 'asc';
        if (currentSort === key) {
          if (currentOrder === 'asc') {
            next.set('order', 'desc');
          } else {
            next.delete('order');
          }
        } else {
          next.set('sort', key);
          next.delete('order');
        }
      }),
    [update],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) =>
      update((next) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete('page');
      }),
    [update],
  );

  const setFilterKeys = filterKeys.join(',');
  const clearFilters = useCallback(
    () =>
      update((next) => {
        for (const key of setFilterKeys ? setFilterKeys.split(',') : []) {
          next.delete(key);
        }
        next.delete('page');
      }),
    [update, setFilterKeys],
  );

  const state = useMemo<ListState>(() => {
    const filters: Record<string, string> = {};
    for (const key of setFilterKeys ? setFilterKeys.split(',') : []) {
      const value = params.get(key);
      if (value) {
        filters[key] = value;
      }
    }
    const order: SortOrder = params.get('order') === 'desc' ? 'desc' : 'asc';
    return {
      page: Number(params.get('page')) || 1,
      pageSize: Number(params.get('pageSize')) || defaultPageSize,
      search: params.get('search') ?? '',
      sort: params.get('sort') ?? undefined,
      order,
      filters,
    };
  }, [params, setFilterKeys, defaultPageSize]);

  return {
    state,
    searchInput,
    setSearch,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilters,
    activeFilterCount: Object.keys(state.filters).length,
  };
}
