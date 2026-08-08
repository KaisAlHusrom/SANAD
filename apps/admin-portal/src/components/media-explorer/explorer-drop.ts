import type { MediaFolderNode } from '@sanad/contracts';
import { collectDescendantIds, findFolderNode } from './explorer-tree';

/** What is being dragged. Assets travel as a whole selection; a folder travels alone. */
export type ExplorerDragPayload =
  | {
      kind: 'assets';
      ids: string[];
      /**
       * The folder every dragged asset currently sits in — `null` for the root, and `undefined`
       * when the selection spans folders (a selection gathered from a search), in which case
       * "already there" cannot be decided and the move is always meaningful.
       */
      sourceFolderId: string | null | undefined;
    }
  | { kind: 'folder'; id: string; parentId: string | null };

/** Why a drop is refused — each maps to its own sentence, never a generic "invalid" (U23a). */
export type ExplorerDropRejection = 'sameFolder' | 'self' | 'descendant';

export type ExplorerDropVerdict =
  | { ok: true }
  | { ok: false; reason: ExplorerDropRejection };

const ALLOWED: ExplorerDropVerdict = { ok: true };

/**
 * Can this drag land on this folder? Decided BEFORE the drop, from the tree already in hand.
 *
 * The point is that an illegal drop never becomes a request: the cursor says "no" and the target
 * refuses to highlight, instead of the user releasing, waiting, and reading a 400. The descendant
 * rule deliberately mirrors the service's own cycle guard — the two must agree, and the service
 * remains the authority (a stale tree simply loses the race and gets its 400 as before).
 *
 * `targetFolderId` is `null` for the library root, which is a real destination, not an absence.
 */
export function evaluateDrop(
  payload: ExplorerDragPayload,
  targetFolderId: string | null,
  roots: MediaFolderNode[],
): ExplorerDropVerdict {
  if (payload.kind === 'assets') {
    if (payload.sourceFolderId === undefined) return ALLOWED;
    return payload.sourceFolderId === targetFolderId
      ? { ok: false, reason: 'sameFolder' }
      : ALLOWED;
  }

  if (payload.id === targetFolderId) return { ok: false, reason: 'self' };
  if (payload.parentId === targetFolderId) {
    return { ok: false, reason: 'sameFolder' };
  }

  const dragged = findFolderNode(roots, payload.id);
  if (dragged && targetFolderId) {
    const forbidden = collectDescendantIds(dragged);
    if (forbidden.includes(targetFolderId)) {
      return { ok: false, reason: 'descendant' };
    }
  }
  return ALLOWED;
}
