import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { MediaFolderNode } from '@sanad/contracts';
import { useCallback, useState } from 'react';
import {
  evaluateDrop,
  type ExplorerDragPayload,
  type ExplorerDropRejection,
} from './explorer-drop';

/**
 * A droppable folder's dnd id. The library root is a real destination, so it needs an id of its
 * own rather than "no id" — `folder:root`.
 */
export const ROOT_DROP_ID = 'folder:root';

/** The dnd id for a folder target (tree node, breadcrumb crumb, or a folder tile). */
export function folderDropId(folderId: string | null): string {
  return folderId ? `folder:${folderId}` : ROOT_DROP_ID;
}

/** Read a droppable id back into a folder id (`null` = the root). */
function folderIdFromDropId(dropId: string): string | null | undefined {
  if (dropId === ROOT_DROP_ID) return null;
  return dropId.startsWith('folder:')
    ? dropId.slice('folder:'.length)
    : undefined;
}

export interface ExplorerDndState {
  sensors: ReturnType<typeof useSensors>;
  /** What is being dragged right now, or null. */
  payload: ExplorerDragPayload | null;
  /** The droppable currently under the pointer, or null. */
  overId: string | null;
  /** Why the current hover would be refused — null while the drop is legal. */
  rejection: ExplorerDropRejection | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  /** True when this droppable is hovered AND would accept the drop — drives the highlight. */
  isValidTarget: (dropId: string) => boolean;
}

interface UseExplorerDndArgs {
  roots: MediaFolderNode[];
  /** Currently selected asset ids — dragging one of them drags the whole selection. */
  selectedIds: string[];
  /** The folder on screen; where a dragged asset is coming FROM. `null` is the root. */
  currentFolderId: string | null;
  onMoveAssets: (ids: string[], folderId: string | null) => void;
  onMoveFolder: (id: string, parentId: string | null) => void;
  /** Read-only users can look, but not rearrange. */
  enabled: boolean;
}

/**
 * Organizing by drag (U5), on `@dnd-kit` — the library the sortable lists already use, chosen over
 * hand-rolled HTML5 drag-and-drop because it is keyboard- and touch-capable rather than
 * mouse-only.
 *
 * Dragging files from the OS is a different mechanism entirely: the browser fires native
 * `dragover`/`drop` with `dataTransfer.files`, which dnd-kit never sees. The two coexist — dnd-kit
 * only claims pointer events on its OWN draggables — and the content pane handles the native pair
 * itself (see `media-explorer.tsx`).
 *
 * The legality of a drop is decided while hovering, not after releasing: an illegal target simply
 * never lights up, and the drag overlay says why. That is the difference between "the app told me"
 * and "the server told me 400".
 */
export function useExplorerDnd({
  roots,
  selectedIds,
  currentFolderId,
  onMoveAssets,
  onMoveFolder,
  enabled,
}: UseExplorerDndArgs): ExplorerDndState {
  const [payload, setPayload] = useState<ExplorerDragPayload | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [rejection, setRejection] = useState<ExplorerDropRejection | null>(
    null,
  );

  const sensors = useSensors(
    // A few pixels of travel before a drag begins, so a plain click still SELECTS rather than
    // starting a drag the user never asked for.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const readPayload = useCallback(
    (event: DragStartEvent): ExplorerDragPayload | null => {
      const data = event.active.data.current as
        | { payload?: ExplorerDragPayload }
        | undefined;
      const dragged = data?.payload;
      if (!dragged) return null;
      if (dragged.kind !== 'assets') return dragged;

      // Dragging a tile that is part of the selection moves the WHOLE selection — anything else
      // would quietly drop the other N-1 files the user had chosen.
      const ids = dragged.ids.some((id) => selectedIds.includes(id))
        ? selectedIds
        : dragged.ids;
      return { ...dragged, ids, sourceFolderId: currentFolderId };
    },
    [currentFolderId, selectedIds],
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!enabled) return;
      setPayload(readPayload(event));
      setRejection(null);
    },
    [enabled, readPayload],
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const id = event.over ? String(event.over.id) : null;
      setOverId(id);
      if (!payload || id === null) {
        setRejection(null);
        return;
      }
      const target = folderIdFromDropId(id);
      if (target === undefined) {
        setRejection(null);
        return;
      }
      const verdict = evaluateDrop(payload, target, roots);
      setRejection(verdict.ok ? null : verdict.reason);
    },
    [payload, roots],
  );

  const reset = useCallback(() => {
    setPayload(null);
    setOverId(null);
    setRejection(null);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragged = payload;
      reset();
      if (!dragged || !event.over) return;

      const target = folderIdFromDropId(String(event.over.id));
      if (target === undefined) return;
      if (!evaluateDrop(dragged, target, roots).ok) return;

      if (dragged.kind === 'assets') {
        onMoveAssets(dragged.ids, target);
      } else {
        onMoveFolder(dragged.id, target);
      }
    },
    [onMoveAssets, onMoveFolder, payload, reset, roots],
  );

  const isValidTarget = useCallback(
    (dropId: string) =>
      overId === dropId && rejection === null && payload !== null,
    [overId, payload, rejection],
  );

  return {
    sensors,
    payload,
    overId,
    rejection,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel: reset,
    isValidTarget,
  };
}
