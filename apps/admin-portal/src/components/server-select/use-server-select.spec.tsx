import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ServerSelectProps,
  ServerSelectResolveQuery,
  ServerSelectSearchQuery,
} from './server-select.types';
import { useServerSelect } from './use-server-select';

interface Item {
  id: string;
  name: string;
}

const ITEMS: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: `f${i + 1}`,
  name: `Folder ${i + 1}`,
}));

/**
 * A search hook STABLE per-arg (mirrors RTK's memoized data identity — a fresh object each
 * render would loop the accumulator effect), recording the args it was called with. Built
 * ONCE per test and passed as a stable prop.
 */
function searchMock(all: Item[] = ITEMS) {
  const calls: {
    search: string;
    page: number;
    pageSize: number;
    skip: boolean;
  }[] = [];
  const cache = new Map<string, ReturnType<ServerSelectSearchQuery<Item>>>();
  const useSearch: ServerSelectSearchQuery<Item> = (arg, opts) => {
    calls.push({ ...arg, skip: opts.skip });
    const key = `${arg.search}|${arg.page}|${arg.pageSize}|${opts.skip}`;
    const cached = cache.get(key);
    if (cached) return cached;
    let result: ReturnType<ServerSelectSearchQuery<Item>>;
    if (opts.skip) {
      result = { data: undefined, isFetching: false, isError: false };
    } else {
      const filtered = arg.search
        ? all.filter((i) => i.name.includes(arg.search))
        : all;
      const start = (arg.page - 1) * arg.pageSize;
      result = {
        data: {
          items: filtered.slice(start, start + arg.pageSize),
          meta: {
            page: arg.page,
            pageSize: arg.pageSize,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / arg.pageSize),
          },
        },
        isFetching: false,
        isError: false,
      };
    }
    cache.set(key, result);
    return result;
  };
  return { useSearch, calls };
}

function resolveMock(all: Item[] = ITEMS) {
  const cache = new Map<string, ReturnType<ServerSelectResolveQuery<Item>>>();
  const useResolveByIds: ServerSelectResolveQuery<Item> = (ids, opts) => {
    const key = `${ids.join(',')}|${opts.skip}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const result = opts.skip
      ? { data: undefined, isFetching: false }
      : { data: all.filter((i) => ids.includes(i.id)), isFetching: false };
    cache.set(key, result);
    return result;
  };
  return { useResolveByIds };
}

function baseProps(
  over: Partial<ServerSelectProps<Item>> = {},
): ServerSelectProps<Item> {
  return {
    value: undefined,
    onChange: vi.fn(),
    useSearch: searchMock().useSearch,
    useResolveByIds: resolveMock().useResolveByIds,
    getOptionValue: (item) => item.id,
    getOptionLabel: (item) => item.name,
    pageSize: 10,
    ...over,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useServerSelect', () => {
  it('skips the search query while the popover is closed', () => {
    const { useSearch, calls } = searchMock();
    const props = baseProps({ useSearch });
    renderHook(() => useServerSelect(props));
    expect(calls.every((c) => c.skip)).toBe(true);
  });

  it('loads page 1 once opened', () => {
    const props = baseProps();
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    expect(result.current.options).toHaveLength(10);
    expect(result.current.hasMore).toBe(true);
  });

  it('debounces the search and queries the term once on page 1', () => {
    vi.useFakeTimers();
    const { useSearch, calls } = searchMock();
    const props = baseProps({ useSearch });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    act(() => result.current.setSearch('Folder 1'));
    expect(
      calls.filter((c) => c.search === 'Folder 1' && !c.skip),
    ).toHaveLength(0);
    act(() => vi.advanceTimersByTime(300));
    const termCalls = calls.filter((c) => c.search === 'Folder 1' && !c.skip);
    expect(termCalls.length).toBeGreaterThan(0);
    expect(termCalls[0]?.page).toBe(1);
  });

  it('coalesces rapid typing into the latest term', () => {
    vi.useFakeTimers();
    const { useSearch, calls } = searchMock();
    const props = baseProps({ useSearch });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    act(() => result.current.setSearch('Fo'));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.setSearch('Folder 2'));
    act(() => vi.advanceTimersByTime(300));
    expect(calls.some((c) => c.search === 'Fo' && !c.skip)).toBe(false);
    expect(calls.some((c) => c.search === 'Folder 2' && !c.skip)).toBe(true);
  });

  it('appends + dedupes overlapping pages on loadMore', () => {
    // page 1 = f1..f10, page 2 = f10..f19 (f10 repeats) → f10 appears once, total 19.
    const page1 = ITEMS.slice(0, 10);
    const page2 = ITEMS.slice(9, 19);
    const cache = new Map<string, ReturnType<ServerSelectSearchQuery<Item>>>();
    const useSearch: ServerSelectSearchQuery<Item> = (arg, opts) => {
      const key = `${arg.page}|${opts.skip}`;
      const cached = cache.get(key);
      if (cached) return cached;
      const items = opts.skip ? [] : arg.page === 1 ? page1 : page2;
      const result: ReturnType<ServerSelectSearchQuery<Item>> = {
        data: opts.skip
          ? undefined
          : {
              items,
              meta: { page: arg.page, pageSize: 10, total: 19, totalPages: 2 },
            },
        isFetching: false,
        isError: false,
      };
      cache.set(key, result);
      return result;
    };
    const props = baseProps({ useSearch });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    expect(result.current.options).toHaveLength(10);
    act(() => result.current.loadMore());
    const values = result.current.options.map((o) => o.value);
    expect(values).toHaveLength(19);
    expect(new Set(values).size).toBe(19);
  });

  it('pins resolved selected values first and never duplicates them', () => {
    // f15 lives on page 2; it must show first (resolved) and only once after page 2 loads.
    const props = baseProps({ value: 'f15', pageSize: 10 });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    expect(result.current.options[0]?.value).toBe('f15');
    act(() => result.current.loadMore());
    expect(
      result.current.options.filter((o) => o.value === 'f15'),
    ).toHaveLength(1);
    expect(result.current.options[0]?.value).toBe('f15');
  });

  it('single select emits the scalar value, fires onItemSelect, and closes', () => {
    const onChange = vi.fn();
    const onItemSelect = vi.fn();
    const props = baseProps({ onChange, onItemSelect });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    const [option] = result.current.options;
    if (!option) throw new Error('expected a loaded option');
    act(() => result.current.select(option));
    expect(onChange).toHaveBeenCalledWith('f1');
    expect(onItemSelect).toHaveBeenCalledWith(option.item);
    expect(result.current.open).toBe(false);
  });

  it('multi select toggles the array, removes a value, and stays open', () => {
    const onChange = vi.fn();
    const props = baseProps({ multiple: true, value: ['f1'], onChange });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    const second = result.current.options.find((o) => o.value === 'f2');
    if (!second) throw new Error('expected option f2');
    act(() => result.current.select(second));
    expect(onChange).toHaveBeenLastCalledWith(['f1', 'f2']);
    expect(result.current.open).toBe(true);
    act(() => result.current.remove('f1'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('clears to undefined (single) and notifies onItemSelect(null)', () => {
    const onChange = vi.fn();
    const onItemSelect = vi.fn();
    const props = baseProps({ value: 'f1', onChange, onItemSelect });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.clear());
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(onItemSelect).toHaveBeenLastCalledWith(null);
  });

  it('fires onItemSelect once when a single prefill resolves', () => {
    const onItemSelect = vi.fn();
    const props = baseProps({ value: 'f5', onItemSelect });
    renderHook(() => useServerSelect(props));
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(onItemSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f5' }),
    );
  });

  it('resolves selected ids to labels for chips', () => {
    const props = baseProps({ multiple: true, value: ['f3', 'f7'] });
    const { result } = renderHook(() => useServerSelect(props));
    expect(result.current.selectedOptions.map((o) => o.label)).toEqual([
      'Folder 3',
      'Folder 7',
    ]);
  });

  it('reports empty when an opened search has no results', () => {
    vi.useFakeTimers();
    const props = baseProps();
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    act(() => result.current.setSearch('nothing-matches'));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.isEmpty).toBe(true);
  });

  it('keeps the query skipped when disabled even if opened', () => {
    const { useSearch, calls } = searchMock();
    const props = baseProps({ useSearch, disabled: true });
    const { result } = renderHook(() => useServerSelect(props));
    act(() => result.current.setOpen(true));
    expect(calls.every((c) => c.skip)).toBe(true);
  });
});
