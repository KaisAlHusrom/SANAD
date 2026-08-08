import { arrayMove } from '@dnd-kit/sortable';

/**
 * Pure reorder math for the DataTable drag (U21): move the `activeId` row to the `overId`
 * position, returning the new row order — or `null` when nothing should change (same row, or an
 * id not in the set). Kept pure so the reorder behavior is unit-tested without simulating dnd.
 */
export function reorderRows<TRow>(
  rows: TRow[],
  activeId: string,
  overId: string,
  getId: (row: TRow) => string,
): TRow[] | null {
  if (activeId === overId) {
    return null;
  }
  const oldIndex = rows.findIndex((row) => getId(row) === activeId);
  const newIndex = rows.findIndex((row) => getId(row) === overId);
  if (oldIndex < 0 || newIndex < 0) {
    return null;
  }
  return arrayMove(rows, oldIndex, newIndex);
}
