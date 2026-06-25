import { zodResolver } from '@hookform/resolvers/zod';
import {
  folderCreateRequestSchema,
  type FolderCreateRequest,
} from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import type { ApiError } from '../../../data/types/api-error.types';
import { useCreateFolderMutation } from '../api/media.api';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

function folderErrorKey(error: unknown, t: TFunction<'media'>): string {
  if (isApiError(error)) return error.message;
  return t('errors.unknown');
}

interface UseCreateFolderResult {
  form: UseFormReturn<FolderCreateRequest>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * New-folder form logic (U5/F6). The dialog is a global-registry modal, so open/close is
 * owned by the registry (`onClose`). On success it toasts + closes; on error it keeps the
 * dialog open with an inline + toast message.
 */
export function useCreateFolder(onClose: () => void): UseCreateFolderResult {
  const { t } = useTranslation('media');
  const [createFolder, { isLoading }] = useCreateFolderMutation();

  const form = useForm<FolderCreateRequest>({
    resolver: zodResolver(folderCreateRequestSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createFolder(values).unwrap();
      form.reset({ name: '' });
      toast.success(t('folder.toastSuccess'));
      onClose();
    } catch (error) {
      const message = folderErrorKey(error, t);
      form.setError('root', { message });
      toast.error(message);
    }
  });

  return { form, onSubmit, isSubmitting: isLoading };
}
