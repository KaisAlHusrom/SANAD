import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeletePageMutation } from '../api/pages.api';

interface UseDeletePageResult {
  requestDelete: (id: string) => Promise<void>;
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Delete-page logic (U5): the shared mutation-aware confirmation + toast. Deleting a page
 * cascades its sections + blocks (the server soft-deletes the tree). On failure the prompt
 * stays open (rethrow) + an error toast; the bulk variant rejects on cancel to keep selection.
 */
export function useDeletePage(): UseDeletePageResult {
  const { t } = useTranslation('pages');
  const { confirm } = useConfirm();
  const [deletePage] = useDeletePageMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.message'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deletePage(id).unwrap();
          toast.success(t('delete.toastSuccess'));
        } catch {
          const message = t('errors.deleteFailed');
          toast.error(message);
          throw new Error(message);
        }
      },
    });
  };

  const requestDeleteMany = async (ids: string[]): Promise<void> => {
    const confirmed = await confirm({
      title: t('delete.bulkTitle'),
      message: t('delete.bulkMessage', { count: ids.length }),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await Promise.all(ids.map((id) => deletePage(id).unwrap()));
          toast.success(t('delete.bulkToastSuccess', { count: ids.length }));
        } catch {
          const message = t('errors.deleteFailed');
          toast.error(message);
          throw new Error(message);
        }
      },
    });
    if (!confirmed) {
      throw new Error('cancelled');
    }
  };

  return { requestDelete, requestDeleteMany };
}
