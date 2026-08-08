import type { MediaFolder, MediaFolderNode } from '@sanad/contracts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '../../data/api/api-error';
import { useConfirm } from '../../data/confirm/use-confirm';
import {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useUpdateFolderMutation,
} from '../../data/media-manage.api';
import { toast } from '../../data/toast/use-toast';

export interface UseFolderActionsResult {
  /** Returns the created folder, or null with the reason already surfaced. */
  create: (
    name: string,
    parentId: string | null,
  ) => Promise<MediaFolder | null>;
  /** Returns the error message on failure (rendered inline beside the field), or null on success. */
  rename: (id: string, name: string) => Promise<string | null>;
  /**
   * Confirms, then deletes. A folder with contents is never destroyed silently: the dialog says
   * exactly what is inside and its primary action MOVES those contents up one level.
   * Resolves true when the folder is gone.
   */
  remove: (node: MediaFolderNode) => Promise<boolean>;
  isBusy: boolean;
  /** The id currently being renamed/deleted — for a per-row busy state. */
  busyId: string | null;
}

/**
 * Create / rename / delete a folder (U5), with every outcome spoken aloud (U23).
 *
 * Rename returns its message instead of only toasting it, because a name clash (409) belongs on
 * the field the user is still typing in — a toast would vanish while the bad name stays.
 */
export function useFolderActions(): UseFolderActionsResult {
  const { t } = useTranslation('mediaExplorer');
  const { confirm } = useConfirm();
  const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();
  const [updateFolder, { isLoading: isRenaming }] = useUpdateFolderMutation();
  const [deleteFolder, { isLoading: isDeleting }] = useDeleteFolderMutation();
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = useCallback(
    async (name: string, parentId: string | null) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      try {
        const created = await createFolder({
          name: trimmed,
          ...(parentId ? { parentId } : {}),
        }).unwrap();
        toast.success(t('folder.created', { name: created.name }));
        return created;
      } catch (caught) {
        toast.error(apiErrorMessage(caught, t('folder.createFailed')));
        return null;
      }
    },
    [createFolder, t],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return t('folder.createFailed');
      setBusyId(id);
      try {
        const updated = await updateFolder({
          id,
          body: { name: trimmed },
        }).unwrap();
        toast.success(t('folder.renamed', { name: updated.name }));
        return null;
      } catch (caught) {
        return apiErrorMessage(caught, t('folder.renameFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [updateFolder, t],
  );

  const remove = useCallback(
    async (node: MediaFolderNode) => {
      const folders = node.children.length;
      const assets = node.assetCount;
      const isEmpty = folders === 0 && assets === 0;

      let removed = false;
      await confirm({
        title: t('folder.deleteTitle', { name: node.name }),
        message: isEmpty
          ? t('folder.deleteEmpty')
          : t('folder.deleteNonEmpty', { assets, folders }),
        variant: 'danger',
        confirmLabel: isEmpty
          ? t('folder.deleteConfirm')
          : t('folder.deleteReparentConfirm'),
        onConfirm: async () => {
          setBusyId(node.id);
          try {
            // `block` for an empty folder is the honest request — it asserts the folder really
            // is empty, so a file added from another tab a second ago stops the delete instead
            // of being quietly relocated.
            await deleteFolder({
              id: node.id,
              strategy: isEmpty ? 'block' : 'reparent',
            }).unwrap();
            removed = true;
            toast.success(t('folder.deleted'));
          } catch (caught) {
            // Thrown, not swallowed: the confirm dialog stays open and shows the reason.
            throw new Error(apiErrorMessage(caught, t('folder.deleteFailed')));
          } finally {
            setBusyId(null);
          }
        },
      });
      return removed;
    },
    [confirm, deleteFolder, t],
  );

  return {
    create,
    rename,
    remove,
    isBusy: isCreating || isRenaming || isDeleting,
    busyId,
  };
}
