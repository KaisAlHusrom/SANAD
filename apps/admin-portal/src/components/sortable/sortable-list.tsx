import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { reorderRows } from '../data-table/data-table-reorder';

type SortableState = ReturnType<typeof useSortable>;

/** The drag-handle wiring a `renderItem` spreads onto its grip button (or `<DragHandle/>`). */
export interface SortableHandle {
  ref: SortableState['setActivatorNodeRef'];
  attributes: SortableState['attributes'];
  listeners: SortableState['listeners'];
}

export interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  /** Receives the full new id order; on reject the optimistic order reverts (U21). */
  onReorder: (orderedIds: string[]) => Promise<void>;
  renderItem: (item: T, handle: SortableHandle | null) => ReactNode;
  /** `vertical` = a stacked list; `grid` = a flex-wrap chip strip. */
  orientation?: 'vertical' | 'grid';
  /** Disable dragging (no permission, or a filtered view) — items still render. */
  disabled?: boolean;
  className?: string;
}

function SortableItem<T>({
  id,
  item,
  renderItem,
}: {
  id: string;
  item: T;
  renderItem: (item: T, handle: SortableHandle) => ReactNode;
}) {
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
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-80')}
    >
      {renderItem(item, {
        ref: setActivatorNodeRef,
        attributes,
        listeners,
      })}
    </div>
  );
}

/**
 * A generic, optimistic drag-reorder list (U21) — the bespoke-tree analog of the `DataTable`'s
 * row reorder, reused by the pages-builder (sections strip + a section's blocks) and the menus
 * editor. Drops the new id order to `onReorder`; reverts the local order if the server rejects.
 * `renderItem` receives a `SortableHandle` (null when `disabled`) to wire its own grip via
 * `<DragHandle/>`, so each surface keeps its own card/chip markup.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  orientation = 'vertical',
  disabled,
  className,
}: SortableListProps<T>) {
  const [localOrder, setLocalOrder] = useState<T[] | null>(null);
  // Drop the optimistic order whenever the server set changes (a re-fetch after save).
  useEffect(() => setLocalOrder(null), [items]);
  const ordered = localOrder ?? items;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (disabled) {
    return (
      <div className={className}>
        {ordered.map((item) => (
          <div key={getId(item)}>{renderItem(item, null)}</div>
        ))}
      </div>
    );
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const next = reorderRows(
      ordered,
      String(active.id),
      String(over.id),
      getId,
    );
    if (!next) {
      return;
    }
    setLocalOrder(next);
    try {
      await onReorder(next.map(getId));
    } catch {
      setLocalOrder(null); // revert on failure
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={
        orientation === 'vertical'
          ? [restrictToVerticalAxis, restrictToParentElement]
          : [restrictToParentElement]
      }
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ordered.map(getId)}
        strategy={
          orientation === 'vertical'
            ? verticalListSortingStrategy
            : rectSortingStrategy
        }
      >
        <div className={className}>
          {ordered.map((item) => (
            <SortableItem
              key={getId(item)}
              id={getId(item)}
              item={item}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** The shared grip-handle button a sortable item renders from its `SortableHandle` (U21). */
export function DragHandle({
  handle,
  label,
  className,
}: {
  handle: SortableHandle | null;
  label: string;
  className?: string;
}) {
  if (!handle) {
    return null;
  }
  return (
    <button
      type="button"
      ref={handle.ref}
      aria-label={label}
      className={cn(
        'grid size-7 cursor-grab touch-none place-items-center rounded-input text-faint hover:bg-surface-2 hover:text-text active:cursor-grabbing',
        className,
      )}
      {...handle.attributes}
      {...handle.listeners}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}
