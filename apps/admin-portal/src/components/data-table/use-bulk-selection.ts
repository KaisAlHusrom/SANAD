import { useCallback, useMemo, useState } from 'react';

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
}

/**
 * Local (page-scoped, ephemeral) row selection for the DataTable bulk bar (U5). Selection
 * lives in component state — NOT the URL (not shareable) and NOT Redux — and clears on a
 * successful bulk action. Tri-state derives from the CURRENT rows.
 */
export function useBulkSelection<TRow>(
  rows: TRow[],
  getRowId: (row: TRow) => string,
): UseBulkSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
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

  const clear = useCallback(() => setSelected(new Set()), []);
  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return {
    selectedIds: [...selected],
    count: selected.size,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggle,
    toggleAll,
    clear,
  };
}
