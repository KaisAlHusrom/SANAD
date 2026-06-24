import { uploadNotAllowed } from './media-errors.js';

/**
 * Enforce the coded upload policy (U18): the content type must be in the allowlist and
 * the declared size must not exceed the ceiling. Throws a 400 `RpcException` the gateway
 * maps (MS2). Pure aside from the throw — unit-tested.
 */
export function assertUploadAllowed(
  contentType: string,
  size: number,
  maxBytes: number,
  allowed: readonly string[],
): void {
  if (!allowed.includes(contentType)) {
    throw uploadNotAllowed(`Unsupported content type: ${contentType}`);
  }
  if (size > maxBytes) {
    throw uploadNotAllowed(
      `File exceeds the ${maxBytes}-byte limit (got ${size})`,
    );
  }
}
