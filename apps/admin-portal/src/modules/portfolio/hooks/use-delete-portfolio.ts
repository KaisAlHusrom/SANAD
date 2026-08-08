import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeletePortfolioMutation } from '../api/portfolio.api';

interface UseDeletePortfolioResult {
  /** Confirm + delete one project (row action). */
  requestDelete: (id: string) => Promise<void>;
  /** Confirm + delete the selected projects (bulk action); throws on cancel to keep selection. */
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/**
 * Delete-project logic (U5): the shared mutation-aware confirmation + toast. On failure the
 * confirmation stays open (rethrow) and an error toast fires; the bulk variant rejects on
 * cancel so the DataTable keeps the selection.
 */
export function useDeletePortfolio(): UseDeletePortfolioResult {
  const { t } = useTranslation('portfolio');
  const { confirm } = useConfirm();
  const [deletePortfolio] = useDeletePortfolioMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.message'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deletePortfolio(id).unwrap();
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
          await Promise.all(ids.map((id) => deletePortfolio(id).unwrap()));
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
