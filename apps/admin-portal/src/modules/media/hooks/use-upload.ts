import type { MediaAsset } from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../../data/types/api-error.types';
import {
  useConfirmUploadMutation,
  useSignUploadMutation,
} from '../api/media.api';
import { putToR2, UploadTransportError } from '../lib/put-to-r2';
import { readImageDimensions } from '../lib/read-image-dimensions';

export type UploadStatus =
  | 'idle'
  | 'signing'
  | 'uploading'
  | 'confirming'
  | 'done'
  | 'error';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

function uploadErrorKey(error: unknown, t: TFunction<'media'>): string {
  if (error instanceof UploadTransportError) return t('errors.uploadFailed');
  if (isApiError(error)) {
    if (error.status === 503) return t('errors.storageUnconfigured');
    return error.message;
  }
  return t('errors.unknown');
}

interface UseUploadResult {
  upload: (file: File, folderId?: string) => Promise<MediaAsset | null>;
  status: UploadStatus;
  error: string | null;
  isUploading: boolean;
  reset: () => void;
}

/**
 * Orchestrates the presigned-upload flow (U5): sign (gateway) → raw PUT direct to R2 →
 * read image dimensions → confirm (gateway). A single error state covers all three legs;
 * the `media.asset.uploaded` event + list refresh happen in the confirm mutation (W4).
 */
export function useUpload(): UseUploadResult {
  const { t } = useTranslation('media');
  const [signUpload] = useSignUploadMutation();
  const [confirmUpload] = useConfirmUploadMutation();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, folderId?: string): Promise<MediaAsset | null> => {
      setError(null);
      try {
        setStatus('signing');
        const signed = await signUpload({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          folderId,
        }).unwrap();

        setStatus('uploading');
        await putToR2(signed.upload, file);

        setStatus('confirming');
        const dimensions = await readImageDimensions(file);
        const confirmed = await confirmUpload({
          id: signed.asset.id,
          body: { width: dimensions?.width, height: dimensions?.height },
        }).unwrap();

        setStatus('done');
        return confirmed;
      } catch (caught) {
        setStatus('error');
        setError(uploadErrorKey(caught, t));
        return null;
      }
    },
    [signUpload, confirmUpload, t],
  );

  return {
    upload,
    status,
    error,
    isUploading:
      status === 'signing' || status === 'uploading' || status === 'confirming',
    reset,
  };
}
