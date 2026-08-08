import type { MenuKey, MenuTree } from '@sanad/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import {
  useDeleteMenuItemMutation,
  useGetMenuTreeQuery,
  useReorderMenuItemsMutation,
} from '../api/menus.api';

export interface UseMenuEditorResult {
  tree: MenuTree | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (orderedIds: string[]) => Promise<void>;
}

/**
 * A keyed menu's editor logic (U5): loads the one-level item tree and exposes the item delete
 * (confirmed; children cascade) + atomic drag-reorder (U21) for a sibling set (top-level or one
 * parent's children). Item create/edit go through the typed modal; all writes re-fetch the tree.
 */
export function useMenuEditor(menuKey: MenuKey): UseMenuEditorResult {
  const { t } = useTranslation('menus');
  const { confirm } = useConfirm();
  const {
    data: tree,
    isLoading,
    isFetching,
    isError,
  } = useGetMenuTreeQuery(menuKey);
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [reorderMenuItems] = useReorderMenuItemsMutation();

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      await confirm({
        title: t('item.deleteTitle'),
        message: t('item.deleteMessage'),
        variant: 'danger',
        confirmLabel: t('item.deleteConfirm'),
        onConfirm: async () => {
          try {
            await deleteMenuItem({ id, menuKey }).unwrap();
            toast.success(t('item.deleted'));
          } catch {
            const message = t('errors.deleteFailed');
            toast.error(message);
            throw new Error(message);
          }
        },
      });
    },
    [confirm, deleteMenuItem, menuKey, t],
  );

  const reorderItems = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      try {
        await reorderMenuItems({ ids: orderedIds, menuKey }).unwrap();
        toast.success(t('item.reordered'));
      } catch (error) {
        toast.error(t('errors.reorderFailed'));
        throw error;
      }
    },
    [reorderMenuItems, menuKey, t],
  );

  return { tree, isLoading, isFetching, isError, deleteItem, reorderItems };
}
