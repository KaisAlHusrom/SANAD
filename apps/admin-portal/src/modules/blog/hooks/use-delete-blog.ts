import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteBlogMutation } from '../api/blog.api';

interface UseDeleteBlogResult {
  /** Confirm + delete one post (row action). */
  requestDelete: (id: string) => Promise<void>;
  /** Confirm + delete the selected posts (bulk action); throws on cancel to keep selection. */
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Delete-post logic (U5): the shared mutation-aware confirmation + toast. On failure the
 * confirmation stays open (rethrow) and an error toast fires; the bulk variant rejects on cancel
 * so the DataTable keeps the selection.
 */
export function useDeleteBlog(): UseDeleteBlogResult {
  const { t } = useTranslation('blog');
  const { confirm } = useConfirm();
  const [deleteBlog] = useDeleteBlogMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.message'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deleteBlog(id).unwrap();
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
          await Promise.all(ids.map((id) => deleteBlog(id).unwrap()));
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
