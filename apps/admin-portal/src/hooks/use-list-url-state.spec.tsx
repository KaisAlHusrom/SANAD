import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useListUrlState } from './use-list-url-state';

function wrapper(initialRoute: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useListUrlState', () => {
  it('seeds defaults from a bare URL', () => {
    const { result } = renderHook(() => useListUrlState(), {
      wrapper: wrapper('/x'),
    });
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.pageSize).toBe(20);
    expect(result.current.state.order).toBe('asc');
    expect(result.current.state.search).toBe('');
    expect(result.current.state.sort).toBeUndefined();
  });

  it('reads typed state from the URL', () => {
    const { result } = renderHook(
      () => useListUrlState({ filterKeys: ['status'] }),
      {
        wrapper: wrapper(
          '/x?page=2&pageSize=50&search=hi&sort=title&order=desc&status=draft',
        ),
      },
    );
    expect(result.current.state.page).toBe(2);
    expect(result.current.state.pageSize).toBe(50);
    expect(result.current.state.search).toBe('hi');
    expect(result.current.state.sort).toBe('title');
    expect(result.current.state.order).toBe('desc');
    expect(result.current.state.filters).toEqual({ status: 'draft' });
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('setPage writes the page (and omits page=1)', () => {
    const { result } = renderHook(() => useListUrlState(), {
      wrapper: wrapper('/x'),
    });
    act(() => result.current.setPage(3));
    expect(result.current.state.page).toBe(3);
    act(() => result.current.setPage(1));
    expect(result.current.state.page).toBe(1);
  });

  it('debounces search → URL and resets to page 1', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useListUrlState(), {
      wrapper: wrapper('/x?page=4'),
    });
    act(() => result.current.setSearch('hello'));
    expect(result.current.state.search).toBe('');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.state.search).toBe('hello');
    expect(result.current.state.page).toBe(1);
  });

  it('setFilter writes the param and resets to page 1; clearing removes it', () => {
    const { result } = renderHook(
      () => useListUrlState({ filterKeys: ['status'] }),
      { wrapper: wrapper('/x?page=3') },
    );
    act(() => result.current.setFilter('status', 'published'));
    expect(result.current.state.filters.status).toBe('published');
    expect(result.current.state.page).toBe(1);
    act(() => result.current.setFilter('status', undefined));
    expect(result.current.state.filters.status).toBeUndefined();
  });

  it('setSort toggles asc ↔ desc and switches column', () => {
    const { result } = renderHook(() => useListUrlState(), {
      wrapper: wrapper('/x'),
    });
    act(() => result.current.setSort('title'));
    expect(result.current.state.sort).toBe('title');
    expect(result.current.state.order).toBe('asc');
    act(() => result.current.setSort('title'));
    expect(result.current.state.order).toBe('desc');
    act(() => result.current.setSort('name'));
    expect(result.current.state.sort).toBe('name');
    expect(result.current.state.order).toBe('asc');
  });

  it('clearFilters strips all filter params but keeps sort', () => {
    const { result } = renderHook(
      () => useListUrlState({ filterKeys: ['status', 'type'] }),
      { wrapper: wrapper('/x?status=draft&type=image&sort=title') },
    );
    expect(result.current.activeFilterCount).toBe(2);
    act(() => result.current.clearFilters());
    expect(result.current.activeFilterCount).toBe(0);
    expect(result.current.state.sort).toBe('title');
  });

  it('clears the search back to empty (param removed)', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useListUrlState(), {
      wrapper: wrapper('/x?search=hi&page=2'),
    });
    expect(result.current.state.search).toBe('hi');
    act(() => result.current.setSearch(''));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.state.search).toBe('');
    expect(result.current.state.page).toBe(1);
  });
});
