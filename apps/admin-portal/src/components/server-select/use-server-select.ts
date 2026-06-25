import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import type {
  ServerSelectOption,
  ServerSelectProps,
} from './server-select.types';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DEBOUNCE = 300;

export interface UseServerSelectResult<T> {
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (term: string) => void;
  /** Browse options (resolved-selected pinned first, then accumulated pages, deduped). */
  options: ServerSelectOption<T>[];
  /** The selected values resolved to options, in selection order (for chips / the label). */
  selectedOptions: ServerSelectOption<T>[];
  selectedValues: string[];
  isFetching: boolean;
  isError: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** Ref callback for the infinite-scroll sentinel element. */
  setSentinel: (node: HTMLElement | null) => void;
  /** Select (single → set + close + notify) or toggle (multi → add/remove, stays open). */
  select: (option: ServerSelectOption<T>) => void;
  /** Remove one value (multi chips). */
  remove: (value: string) => void;
  clear: () => void;
  isSelected: (value: string) => boolean;
}

/**
 * The W5 server-searched picker's logic (U5). Decoupled from any module api: the caller
 * passes its own lookup-api query hooks (`useSearch` + `useResolveByIds`). Debounced
 * server search, infinite-scroll pagination (append + dedupe), selected values pinned
 * first via a separate resolve-by-id query, single + multi selection.
 */
export function useServerSelect<T>(
  props: ServerSelectProps<T>,
): UseServerSelectResult<T> {
  const {
    value,
    onChange,
    multiple = false,
    useSearch,
    useResolveByIds,
    getOptionValue,
    getOptionLabel,
    renderOption,
    onItemSelect,
    pageSize = DEFAULT_PAGE_SIZE,
    searchDebounce = DEFAULT_DEBOUNCE,
    disabled = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, searchDebounce);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<T[]>([]);

  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  const selectedValuesRef = useRef(selectedValues);
  selectedValuesRef.current = selectedValues;

  const searchResult = useSearch(
    { search: debouncedSearch, page, pageSize },
    { skip: !open || disabled },
  );
  const resolveResult = useResolveByIds(selectedValues, {
    skip: selectedValues.length === 0,
  });
  const resolvedItems = useMemo(
    () => resolveResult.data ?? [],
    [resolveResult.data],
  );

  // A new search resets to page 1 + clears the accumulator; pages then append.
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [debouncedSearch]);

  useEffect(() => {
    const data = searchResult.data;
    if (!data) {
      return;
    }
    setAccumulated((prev) => {
      if (data.meta.page === 1) {
        return data.items;
      }
      const seen = new Set(prev.map(getOptionValue));
      return [
        ...prev,
        ...data.items.filter((item) => !seen.has(getOptionValue(item))),
      ];
    });
    // Keyed on the (per-arg stable) data only — getOptionValue is a stable accessor and
    // re-running on its identity would thrash the accumulator.
  }, [searchResult.data]);

  const toOption = useCallback(
    (item: T): ServerSelectOption<T> => {
      const label = getOptionLabel(item);
      return {
        value: getOptionValue(item),
        label,
        item,
        node: renderOption?.(item) ?? label,
      };
    },
    [getOptionLabel, getOptionValue, renderOption],
  );

  const options = useMemo(() => {
    const seen = new Set<string>();
    const out: ServerSelectOption<T>[] = [];
    for (const item of [...resolvedItems, ...accumulated]) {
      const value_ = getOptionValue(item);
      if (seen.has(value_)) {
        continue;
      }
      seen.add(value_);
      out.push(toOption(item));
    }
    return out;
  }, [resolvedItems, accumulated, getOptionValue, toOption]);

  const selectedOptions = useMemo(() => {
    const byValue = new Map(options.map((option) => [option.value, option]));
    return selectedValues
      .map((selected) => byValue.get(selected))
      .filter((option): option is ServerSelectOption<T> => Boolean(option));
  }, [options, selectedValues]);

  const data = searchResult.data;
  const hasMore = data ? data.meta.page < data.meta.totalPages : false;
  const isFetching = searchResult.isFetching;
  const isError = searchResult.isError;
  const isEmpty = open && !isFetching && !isError && options.length === 0;

  // Stable loadMore: reads the latest hasMore/isFetching via a ref so the observer
  // subscription doesn't churn on every state change.
  const guardRef = useRef({ hasMore, isFetching });
  guardRef.current = { hasMore, isFetching };
  const loadMore = useCallback(() => {
    if (guardRef.current.hasMore && !guardRef.current.isFetching) {
      setPage((current) => current + 1);
    }
  }, []);

  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!sentinel || !open) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, open, loadMore]);

  // Fire onItemSelect once when a single-mode prefill resolves (edit forms).
  const notifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (multiple || !onItemSelect) {
      return;
    }
    const id = selectedValues[0];
    if (!id || notifiedRef.current === id) {
      return;
    }
    const item = resolvedItems.find(
      (candidate) => getOptionValue(candidate) === id,
    );
    if (item) {
      notifiedRef.current = id;
      onItemSelect(item);
    }
  }, [multiple, onItemSelect, selectedValues, resolvedItems, getOptionValue]);

  const select = useCallback(
    (option: ServerSelectOption<T>) => {
      if (multiple) {
        const current = selectedValuesRef.current;
        const next = current.includes(option.value)
          ? current.filter((entry) => entry !== option.value)
          : [...current, option.value];
        onChange(next);
        return;
      }
      onChange(option.value);
      onItemSelect?.(option.item);
      notifiedRef.current = option.value;
      setOpen(false);
    },
    [multiple, onChange, onItemSelect],
  );

  const remove = useCallback(
    (target: string) => {
      onChange(selectedValuesRef.current.filter((entry) => entry !== target));
    },
    [onChange],
  );

  const clear = useCallback(() => {
    onChange(multiple ? [] : undefined);
    if (!multiple) {
      onItemSelect?.(null);
      notifiedRef.current = null;
    }
  }, [multiple, onChange, onItemSelect]);

  const isSelected = useCallback(
    (target: string) => selectedValuesRef.current.includes(target),
    [],
  );

  const setSearch = useCallback((term: string) => setSearchInput(term), []);

  return {
    open,
    setOpen,
    search: searchInput,
    setSearch,
    options,
    selectedOptions,
    selectedValues,
    isFetching,
    isError,
    isEmpty,
    hasMore,
    loadMore,
    setSentinel,
    select,
    remove,
    clear,
    isSelected,
  };
}
