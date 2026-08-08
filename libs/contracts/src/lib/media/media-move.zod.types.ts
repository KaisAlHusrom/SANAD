import { z } from 'zod';

/** How many assets one drag-and-drop may move — a bound, not a UI limit (N7). */
export const MEDIA_MOVE_MAX_IDS = 200;

/**
 * Move assets into a folder (`PATCH /api/media/move`) — what a drag-and-drop in the explorer
 * actually does. Bulk by design: a multi-select drag is one request, not N.
 *
 * `folderId: null` means the root ("All files"), which is why it is nullable rather than
 * optional — dropping onto the root is an explicit destination, not an omission.
 */
export const mediaMoveRequestSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(MEDIA_MOVE_MAX_IDS),
    folderId: z.string().uuid().nullable(),
  })
  .strict();

export type MediaMoveRequest = z.infer<typeof mediaMoveRequestSchema>;

/**
 * The result of a move. Reports the ids that actually moved rather than a bare count, so the UI
 * can reconcile its optimistic state per item — and `missingIds` names anything that could not
 * be found (deleted in another tab), instead of silently moving fewer than asked (U23).
 */
export interface MediaMoveResult {
  movedIds: string[];
  missingIds: string[];
}
