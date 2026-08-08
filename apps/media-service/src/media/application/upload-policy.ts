import { uploadTooLarge, uploadTypeNotAllowed } from './media-errors.js';

/**
 * Enforce the coded upload policy (U18): the content type must be in the allowlist and
 * the declared size must not exceed the ceiling. Throws a 400 `RpcException` carrying a
 * message key the gateway maps + localizes (MS2, U24). Pure aside from the throw — unit-tested.
 */
export function assertUploadAllowed(
  contentType: string,
  size: number,
  maxBytes: number,
  allowed: readonly string[],
): void {
  if (!allowed.includes(contentType)) {
    throw uploadTypeNotAllowed(contentType);
  }
  if (size > maxBytes) {
    throw uploadTooLarge(maxBytes);
  }
}
