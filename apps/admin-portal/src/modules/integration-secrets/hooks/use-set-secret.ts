import { zodResolver } from '@hookform/resolvers/zod';
import {
  setSecretRequestSchema,
  type SecretKey,
  type SetSecretRequest,
} from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import type { ApiError } from '../../../data/types/api-error.types';
import { useSetSecretMutation } from '../api/integration-secrets.api';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

function setSecretErrorKey(
  error: unknown,
  t: TFunction<'integrationSecrets'>,
): string {
  if (isApiError(error)) {
    if (error.status === 403) return t('errors.forbidden');
    return error.message;
  }
  return t('errors.unknown');
}

interface UseSetSecretResult {
  form: UseFormReturn<SetSecretRequest>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Set/rotate form logic (U5/F6). The dialog is a global-registry modal, so open/close is
 * owned by the registry (`onClose` closes it) — not local state. On success it toasts +
 * closes; on error it keeps the dialog open with an inline + toast message. The plaintext
 * `value` is write-only — cleared on success so it never lingers in component state.
 */
export function useSetSecret(
  secretKey: SecretKey,
  onClose: () => void,
): UseSetSecretResult {
  const { t } = useTranslation('integrationSecrets');
  const [setSecret, { isLoading }] = useSetSecretMutation();

  const form = useForm<SetSecretRequest>({
    resolver: zodResolver(setSecretRequestSchema),
    defaultValues: { value: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await setSecret({ key: secretKey, value: values.value }).unwrap();
      form.reset({ value: '' });
      toast.success(t('dialog.toastSuccess'));
      onClose();
    } catch (error) {
      const message = setSecretErrorKey(error, t);
      form.setError('root', { message });
      toast.error(message);
    }
  });

  return { form, onSubmit, isSubmitting: isLoading };
}
