import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useEditQueryParam } from './use-edit-query-param';

interface Row {
  id: string;
}

function wrapper(initialRoute: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
  );
}

const getId = (row: Row) => row.id;

describe('useEditQueryParam', () => {
  it('opens the editor for the row matching ?edit and fires exactly once', () => {
    const open = vi.fn();
    const rows: Row[] = [{ id: 'a' }, { id: 'b' }];
    const { rerender } = renderHook(
      () => useEditQueryParam(rows, getId, open),
      {
        wrapper: wrapper('/content/portfolio?edit=b'),
      },
    );
    rerender();
    rerender();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith({ id: 'b' });
  });

  it('does nothing when there is no ?edit param', () => {
    const open = vi.fn();
    renderHook(() => useEditQueryParam([{ id: 'a' }], getId, open), {
      wrapper: wrapper('/content/portfolio'),
    });
    expect(open).not.toHaveBeenCalled();
  });

  it('does nothing when the ?edit id is not in the current rows', () => {
    const open = vi.fn();
    renderHook(() => useEditQueryParam([{ id: 'a' }], getId, open), {
      wrapper: wrapper('/content/portfolio?edit=zzz'),
    });
    expect(open).not.toHaveBeenCalled();
  });
});
