import { isApiError } from '../data/api/api-error';
import { UploadTransportError } from './put-to-r2';

/**
 * A classified upload failure: an i18n key (resolved by the caller in ITS namespace) plus the
 * provider's own words when there are any.
 */
export interface UploadFailure {
  /** Key under the caller's namespace, e.g. `errors.cors` → `media:errors.cors`. */
  key: UploadFailureKey;
  /** The provider/server detail to append — `AccessDenied`, a gateway message, … or null. */
  detail: string | null;
  /** Whether retrying the same file could plausibly succeed (offline → yes; 413 → no). */
  retryable: boolean;
}

export type UploadFailureKey =
  | 'errors.cors'
  | 'errors.offline'
  | 'errors.storageUnconfigured'
  | 'errors.tooLarge'
  | 'errors.forbidden'
  | 'errors.uploadRejected'
  | 'errors.uploadFailed'
  | 'errors.unknown';

/**
 * THE single upload-failure classifier (U3/F9) — used by the Media page's `useUpload` and by the
 * picker's `useMediaUpload`, which previously each mapped errors their own way and disagreed
 * about what "unknown" meant.
 *
 * The rule it enforces (U23a): the message names the CAUSE. Every branch below exists because
 * that branch has a different thing for the user to DO — configure CORS, reconnect, ask an
 * admin, pick a smaller file. A failure we cannot name still returns the provider's own text
 * rather than a shrug.
 */
export function classifyUploadError(error: unknown): UploadFailure {
  if (error instanceof UploadTransportError) {
    if (error.kind === 'cors') {
      return { key: 'errors.cors', detail: null, retryable: false };
    }
    if (error.kind === 'network') {
      return { key: 'errors.offline', detail: null, retryable: true };
    }
    const detail = error.providerCode ?? error.providerMessage;
    // 403 from storage on a presigned PUT is almost always the bucket refusing the request
    // (policy/token), NOT our RBAC — say so, and don't send the user hunting for permissions.
    if (error.status === 403) {
      return { key: 'errors.uploadRejected', detail, retryable: false };
    }
    return { key: 'errors.uploadFailed', detail, retryable: true };
  }

  if (isApiError(error)) {
    if (error.status === 503) {
      return {
        key: 'errors.storageUnconfigured',
        detail: null,
        retryable: false,
      };
    }
    if (error.status === 413) {
      return { key: 'errors.tooLarge', detail: null, retryable: false };
    }
    if (error.status === 403) {
      return { key: 'errors.forbidden', detail: null, retryable: false };
    }
    // A real server message beats any generic string we could invent.
    return { key: 'errors.unknown', detail: error.message, retryable: true };
  }

  return { key: 'errors.unknown', detail: null, retryable: true };
}

/** Render a classified failure through the caller's `t`, appending the provider detail. */
export function formatUploadFailure(
  failure: UploadFailure,
  translate: (key: string) => string,
): string {
  const base = translate(failure.key);
  return failure.detail ? `${base} (${failure.detail})` : base;
}
