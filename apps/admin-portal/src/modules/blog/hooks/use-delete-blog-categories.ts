import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteBlogCategoryMutation } from '../api/blog-categories.api';

interface UseDeleteBlogCategoriesResult {
  /** Confirm + delete one category (row action). */
  requestDelete: (id: string) => Promise<void>;
  /** Confirm + delete the selected categories (bulk action); throws on cancel to keep selection. */
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Delete-category logic (U5): the shared mutation-aware confirmation + toast. Posts keep their
 * (now-dangling) `categoryId` — the gateway nulls it server-side.
 */
export function useDeleteBlogCategories(): UseDeleteBlogCategoriesResult {
  const { t } = useTranslation('blog');
  const { confirm } = useConfirm();
  const [deleteCategory] = useDeleteBlogCategoryMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('categoryDelete.title'),
      message: t('categoryDelete.message'),
      variant: 'danger',
      confirmLabel: t('categoryDelete.confirm'),
      onConfirm: async () => {
        try {
          await deleteCategory(id).unwrap();
          toast.success(t('categoryDelete.toastSuccess'));
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
      title: t('categoryDelete.bulkTitle'),
      message: t('categoryDelete.bulkMessage', { count: ids.length }),
      variant: 'danger',
      confirmLabel: t('categoryDelete.confirm'),
      onConfirm: async () => {
        try {
          await Promise.all(ids.map((id) => deleteCategory(id).unwrap()));
          toast.success(
            t('categoryDelete.bulkToastSuccess', { count: ids.length }),
          );
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
