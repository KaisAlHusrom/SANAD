import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { useDeleteMedia } from '../hooks/use-delete-media';

/** Delete trigger for a media asset — the confirmation is rendered by `ConfirmationRoot`. */
export function DeleteMediaButton({ assetId }: { assetId: string }) {
  const { t } = useTranslation('media');
  const { requestDelete } = useDeleteMedia(assetId);

  return (
    <Button type="button" variant="ghost" size="sm" onClick={requestDelete}>
      {t('card.delete')}
    </Button>
  );
}
