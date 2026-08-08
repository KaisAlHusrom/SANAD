import type {
  MediaAsset,
  UploadConfirmBody,
  UploadSignRequest,
  UploadSignResult,
} from '@sanad/contracts';
import { putToR2 } from './put-to-r2';
import { readImageDimensions } from './read-image-dimensions';

/** The three legs of a presigned upload — for a caller-owned status indicator. */
export type UploadStage = 'signing' | 'uploading' | 'confirming';

interface RunMediaUploadArgs {
  /** Sign a pending upload (the gateway mutation, already `.unwrap()`-ed). */
  sign: (req: UploadSignRequest) => Promise<UploadSignResult>;
  /** Confirm the upload once the bytes are in R2 (the gateway mutation, `.unwrap()`-ed). */
  confirm: (id: string, body: UploadConfirmBody) => Promise<MediaAsset>;
  file: File;
  folderId?: string;
  /** Notified as each leg begins, so the hook can drive a status label. */
  onStage?: (stage: UploadStage) => void;
  /** 0→1 while the bytes stream to R2, so a large file shows movement rather than a frozen row. */
  onProgress?: (ratio: number) => void;
}

/**
 * THE presigned-upload sequence (U5/F9), shared by the Media page's `useUpload` (media i18n) and
 * the reusable picker's `useMediaUpload` (common i18n): sign (gateway) → raw PUT direct to R2 →
 * read image dimensions → confirm (gateway). Pure — no React, no i18n; the two hooks own their own
 * status/error state + message mapping. Errors bubble as-is (`UploadTransportError` from the PUT, or
 * the gateway `ApiError` from a rejected mutation) for the caller to classify.
 */
export async function runMediaUpload({
  sign,
  confirm,
  file,
  folderId,
  onStage,
  onProgress,
}: RunMediaUploadArgs): Promise<MediaAsset> {
  onStage?.('signing');
  const signed = await sign({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    folderId,
  });

  onStage?.('uploading');
  await putToR2(signed.upload, file, {
    onProgress: (loaded, total) =>
      onProgress?.(total > 0 ? Math.min(1, loaded / total) : 0),
  });

  onStage?.('confirming');
  const dimensions = await readImageDimensions(file);
  return confirm(signed.asset.id, {
    width: dimensions?.width,
    height: dimensions?.height,
  });
}
