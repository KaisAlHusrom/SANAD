import { useCallback, useMemo, useRef, useState } from 'react';

export interface UseBulkSelectionResult {
  selectedIds: string[];
  count: number;
  /** All CURRENT rows selected. */
  isAllSelected: boolean;
  /** Some, but not all, current rows selected → header checkbox shows indeterminate. */
  isIndeterminate: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** Select all current rows, or clear if they're all already selected. */
  toggleAll: () => void;
  clear: () => void;
  /** Plain click: this row and nothing else. */
  selectOnly: (id: string) => void;
  /** Shift-click: every row between the last clicked one and this one, inclusive. */
  selectRange: (id: string) => void;
}

/**
 * Local (page-scoped, ephemeral) row selection for the DataTable bulk bar (U5). Selection
 * lives in component state — NOT the URL (not shareable) and NOT Redux — and clears on a
 * successful bulk action. Tri-state derives from the CURRENT rows.
 *
 * It also carries the click semantics a file manager needs (`selectOnly` / `selectRange`), because
 * the media explorer selects with the mouse rather than with checkboxes. The anchor those need is
 * kept here, next to the selection it indexes into, rather than duplicated by each caller.
 */
export function useBulkSelection<TRow>(
  rows: TRow[],
  getRowId: (row: TRow) => string,
): UseBulkSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  /** The last row the user acted on — where a shift-click measures from. In a ref: moving the
   *  anchor must never itself cause a render. */
  const anchorRef = useRef<string | null>(null);

  const toggle = useCallback((id: string) => {
    anchorRef.current = id;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const currentIds = useMemo(() => rows.map(getRowId), [rows, getRowId]);

  const isAllSelected =
    currentIds.length > 0 && currentIds.every((id) => selected.has(id));
  const isIndeterminate =
    !isAllSelected && currentIds.some((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allSelected =
        currentIds.length > 0 && currentIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(currentIds);
    });
  }, [currentIds]);

  const clear = useCallback(() => {
    anchorRef.current = null;
    setSelected(new Set());
  }, []);
  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectOnly = useCallback((id: string) => {
    anchorRef.current = id;
    setSelected(new Set([id]));
  }, []);

  const selectRange = useCallback(
    (id: string) => {
      const anchor = anchorRef.current;
      const from = anchor === null ? -1 : currentIds.indexOf(anchor);
      const to = currentIds.indexOf(id);
      // No usable anchor (first click, or the anchor scrolled out of the current page): the only
      // sensible range is the row itself — never the whole list, which would be a surprise.
      if (from === -1 || to === -1) {
        selectOnly(id);
        return;
      }
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      setSelected(new Set(currentIds.slice(start, end + 1)));
    },
    [currentIds, selectOnly],
  );

  return {
    selectedIds: [...selected],
    count: selected.size,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggle,
    toggleAll,
    clear,
    selectOnly,
    selectRange,
  };
}
