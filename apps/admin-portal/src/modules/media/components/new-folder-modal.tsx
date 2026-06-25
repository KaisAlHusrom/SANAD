import * as Label from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useCreateFolder } from '../hooks/use-create-folder';

/** The modal `type` this component serves in the global registry. */
export const NEW_FOLDER_MODAL = 'media.new-folder';

/** Global-registry modal for creating a media folder (W7). */
export function NewFolderModal({ open, onClose }: ModalComponentProps) {
  const { t } = useTranslation('media');
  const { t: tCommon } = useTranslation('common');
  const { form, onSubmit, isSubmitting } = useCreateFolder(onClose);
  const { register, formState } = form;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle className="text-lg font-semibold text-text">
          {t('folder.dialogTitle')}
        </DialogTitle>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="folder-name" className="text-sm text-dim">
              {t('folder.nameLabel')}
            </Label.Root>
            <Input
              id="folder-name"
              placeholder={t('folder.namePlaceholder')}
              {...register('name')}
            />
            {formState.errors.name ? (
              <p className="text-sm text-bad">{t('folder.nameRequired')}</p>
            ) : null}
          </div>
          {formState.errors.root ? (
            <p className="text-sm text-bad" role="alert">
              {formState.errors.root.message}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {tCommon('actions.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              {t('folder.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
