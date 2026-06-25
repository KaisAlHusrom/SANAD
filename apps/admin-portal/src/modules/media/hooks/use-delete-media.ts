import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteMediaMutation } from '../api/media.api';

interface UseDeleteMediaResult {
  requestDelete: () => Promise<void>;
}

/**
 * Delete-media logic (U5): opens the shared confirmation (mutation-aware) and surfaces the
 * outcome via toast. The single `ConfirmationRoot` renders the dialog — no local dialog
 * state. On failure the confirmation stays open (rethrow) and an error toast fires.
 */
export function useDeleteMedia(assetId: string): UseDeleteMediaResult {
  const { t } = useTranslation('media');
  const { confirm } = useConfirm();
  const [deleteMedia] = useDeleteMediaMutation();

  const requestDelete = async (): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.description'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deleteMedia(assetId).unwrap();
          toast.success(t('delete.toastSuccess'));
        } catch {
          const message = t('errors.deleteFailed');
          toast.error(message);
          throw new Error(message);
        }
      },
    });
  };

  return { requestDelete };
}
