import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface DataTableSortableRowProps {
  id: string;
  children: ReactNode;
  rowClassName?: string;
  handleLabel: string;
}

/**
 * A draggable table row (the drag-reorder mode of `DataTable`, U21). Wraps the row in dnd-kit's
 * `useSortable` and renders a leading grip-handle cell; the rest of the cells come as children so
 * the column markup stays single-sourced with the static rows. Direction-agnostic — vertical drag
 * only (the order axis), no physical left/right.
 */
export function DataTableSortableRow({
  id,
  children,
  rowClassName,
  handleLabel,
}: DataTableSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        rowClassName,
        isDragging && 'relative z-10 bg-surface-2 opacity-80 shadow-portal',
      )}
    >
      <td className="w-10 px-2 py-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={handleLabel}
          className="grid size-8 cursor-grab touch-none place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-text active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
      </td>
      {children}
    </tr>
  );
}
