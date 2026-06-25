import * as Label from '@radix-ui/react-label';
import {
  SECRET_REGISTRY,
  secretKeySchema,
  type SecretRegistryEntry,
} from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { useSetSecret } from '../hooks/use-set-secret';

/** The modal `type` this component serves in the global registry. */
export const SET_SECRET_MODAL = 'integration-secret.set';

/** Resolve the registry payload to a known secret entry, or null (U4 — no `unknown` leak). */
function resolveEntry(
  data: Record<string, unknown>,
): SecretRegistryEntry | null {
  const parsed = secretKeySchema.safeParse(data.key);
  return parsed.success ? SECRET_REGISTRY[parsed.data] : null;
}

/** Global-registry modal for setting/rotating one integration secret (W7). */
export function SetSecretModal({ open, onClose, data }: ModalComponentProps) {
  const entry = resolveEntry(data);
  if (!entry) {
    return null;
  }
  return (
    <SetSecretModalForm
      open={open}
      onClose={onClose}
      entry={entry}
      isSet={data.isSet === true}
    />
  );
}

interface SetSecretModalFormProps {
  open: boolean;
  onClose: () => void;
  entry: SecretRegistryEntry;
  isSet: boolean;
}

/** Inner form (hooks run unconditionally once a valid entry is resolved). */
function SetSecretModalForm({
  open,
  onClose,
  entry,
  isSet,
}: SetSecretModalFormProps) {
  const { t } = useTranslation('integrationSecrets');
  const { t: tCommon } = useTranslation('common');
  const { form, onSubmit, isSubmitting } = useSetSecret(entry.key, onClose);
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
          {isSet ? t('dialog.rotateTitle') : t('dialog.setTitle')}
        </DialogTitle>
        <DialogDescription className="text-sm text-dim">
          {t('dialog.description')}
        </DialogDescription>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="secret-value" className="text-sm text-dim">
              {t('dialog.valueLabel')}
            </Label.Root>
            <Input
              id="secret-value"
              type="password"
              autoComplete="off"
              placeholder={t('dialog.valuePlaceholder')}
              {...register('value')}
            />
            {formState.errors.value ? (
              <p className="text-sm text-bad">{t('errors.valueRequired')}</p>
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
              {t('dialog.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
