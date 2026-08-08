import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteBlogTagMutation } from '../api/blog-tags.api';

interface UseDeleteBlogTagsResult {
  /** Confirm + delete one tag (row action). */
  requestDelete: (id: string) => Promise<void>;
  /** Confirm + delete the selected tags (bulk action); throws on cancel to keep selection. */
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Delete-tag logic (U5): the shared mutation-aware confirmation + toast. Posts keep their other
 * tags — the gateway drops the join rows for the removed tag server-side.
 */
export function useDeleteBlogTags(): UseDeleteBlogTagsResult {
  const { t } = useTranslation('blog');
  const { confirm } = useConfirm();
  const [deleteTag] = useDeleteBlogTagMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('tagDelete.title'),
      message: t('tagDelete.message'),
      variant: 'danger',
      confirmLabel: t('tagDelete.confirm'),
      onConfirm: async () => {
        try {
          await deleteTag(id).unwrap();
          toast.success(t('tagDelete.toastSuccess'));
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
      title: t('tagDelete.bulkTitle'),
      message: t('tagDelete.bulkMessage', { count: ids.length }),
      variant: 'danger',
      confirmLabel: t('tagDelete.confirm'),
      onConfirm: async () => {
        try {
          await Promise.all(ids.map((id) => deleteTag(id).unwrap()));
          toast.success(t('tagDelete.bulkToastSuccess', { count: ids.length }));
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
