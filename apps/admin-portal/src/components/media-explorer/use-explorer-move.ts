import { MEDIA_MOVE_MAX_IDS } from '@sanad/contracts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../../data/api/api-error';
import {
  useMoveAssetsMutation,
  useUpdateFolderMutation,
} from '../../data/media-manage.api';
import { toast } from '../../data/toast/use-toast';

export interface UseExplorerMoveResult {
  /** Move files into a folder (`null` = the library root). */
  moveAssets: (ids: string[], folderId: string | null) => Promise<boolean>;
  /** Re-parent a folder (`null` = out to the root). */
  moveFolder: (id: string, parentId: string | null) => Promise<boolean>;
  /**
   * Ids currently in flight. The views hide them at once, so a drop reads as instantly done;
   * if the request fails they come straight back — which is the truth, not a hole the user has
   * to refresh to notice (U23b).
   */
  movingIds: string[];
}

/**
 * What a drag-and-drop actually performs (U5), and what the user sees while it happens.
 *
 * `missingIds` — assets the server could not find, e.g. deleted in another tab — are reported
 * rather than folded into the success count. Moving fewer files than asked is not a success.
 */
export function useExplorerMove(): UseExplorerMoveResult {
  const { t } = useTranslation('mediaExplorer');
  const [moveAssetsMutation] = useMoveAssetsMutation();
  const [updateFolder] = useUpdateFolderMutation();
  const [movingIds, setMovingIds] = useState<string[]>([]);

  const moveAssets = useCallback(
    async (ids: string[], folderId: string | null) => {
      if (ids.length === 0) return false;
      // One drag can gather more than the endpoint accepts; refuse loudly rather than
      // silently truncating the selection to the first 200 (U23).
      if (ids.length > MEDIA_MOVE_MAX_IDS) {
        toast.error(t('move.failed'));
        return false;
      }

      setMovingIds(ids);
      try {
        const result = await moveAssetsMutation({ ids, folderId }).unwrap();
        if (result.movedIds.length > 0) {
          toast.success(t('move.success', { count: result.movedIds.length }));
        }
        if (result.missingIds.length > 0) {
          toast.error(t('move.missing', { count: result.missingIds.length }));
        }
        return result.movedIds.length > 0;
      } catch (caught) {
        toast.error(apiErrorMessage(caught, t('move.failed')));
        return false;
      } finally {
        setMovingIds([]);
      }
    },
    [moveAssetsMutation, t],
  );

  const moveFolder = useCallback(
    async (id: string, parentId: string | null) => {
      setMovingIds([id]);
      try {
        // Tri-state `parentId`: an explicit `null` means "out to the root" and must be SENT,
        // not omitted — omitting it would mean "leave the parent alone".
        await updateFolder({ id, body: { parentId } }).unwrap();
        return true;
      } catch (caught) {
        toast.error(apiErrorMessage(caught, t('move.failed')));
        return false;
      } finally {
        setMovingIds([]);
      }
    },
    [t, updateFolder],
  );

  return { moveAssets, moveFolder, movingIds };
}
