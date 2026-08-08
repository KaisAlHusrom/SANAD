import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteFaqMutation } from '../api/faqs.api';

interface UseDeleteFaqsResult {
  requestDelete: (id: string) => Promise<void>;
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/** Delete-FAQ logic (U5): shared mutation-aware confirmation + toast (single + bulk). */
export function useDeleteFaqs(): UseDeleteFaqsResult {
  const { t } = useTranslation('faqs');
  const { confirm } = useConfirm();
  const [deleteFaq] = useDeleteFaqMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.message'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deleteFaq(id).unwrap();
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
          await Promise.all(ids.map((id) => deleteFaq(id).unwrap()));
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
