import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBulkSelection } from './use-bulk-selection';

interface Row {
  id: string;
}
const rows: Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const getRowId = (row: Row): string => row.id;

describe('useBulkSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    expect(result.current.count).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isIndeterminate).toBe(false);
  });

  it('toggles a single row on and off', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(true);
    expect(result.current.count).toBe(1);
    act(() => result.current.toggle('a'));
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('is indeterminate when some but not all are selected', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggle('a'));
    expect(result.current.isIndeterminate).toBe(true);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('toggleAll selects every current row, then clears', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggleAll());
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedIds.sort()).toEqual(['a', 'b', 'c']);
    act(() => result.current.toggleAll());
    expect(result.current.count).toBe(0);
  });

  it('clears the selection', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggleAll());
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});

/**
 * Explorer click semantics (added for the media explorer, 2026-07-20): a plain click REPLACES the
 * selection, ⌘/ctrl-click adds or removes one, and shift-click takes everything between the last
 * clicked row and this one — what every file manager does, and what nothing here did before.
 */
describe('useBulkSelection — file-manager click semantics', () => {
  it('selectOnly replaces whatever was selected', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggleAll());
    act(() => result.current.selectOnly('b'));
    expect(result.current.selectedIds).toEqual(['b']);
  });

  it('selectRange takes everything between the anchor and the target, inclusive', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.selectOnly('a'));
    act(() => result.current.selectRange('c'));
    expect(result.current.selectedIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('selectRange works backwards too (anchor after the target)', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.selectOnly('c'));
    act(() => result.current.selectRange('a'));
    expect(result.current.selectedIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('selectRange with no anchor yet behaves like a plain click', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.selectRange('b'));
    expect(result.current.selectedIds).toEqual(['b']);
  });

  it('toggle moves the anchor, so a following shift-click ranges from there', () => {
    const { result } = renderHook(() => useBulkSelection(rows, getRowId));
    act(() => result.current.toggle('b'));
    act(() => result.current.selectRange('c'));
    expect(result.current.selectedIds.sort()).toEqual(['b', 'c']);
  });
});
