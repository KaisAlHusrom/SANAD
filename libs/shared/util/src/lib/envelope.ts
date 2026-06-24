import type { HttpResponseEnvelope, ResponseEnvelope } from '@sanad/contracts';

/**
 * Build a success envelope. The backend wraps every response in exactly one place
 * with these helpers; the frontend unwraps in one place (F1, U3).
 */
export function ok<T>(data: T, message = 'OK'): ResponseEnvelope<T> {
  return { success: true, message, data };
}

/** Build a failure envelope with no data payload. */
export function fail(message: string): ResponseEnvelope<null> {
  return { success: false, message, data: null };
}

function isCoreEnvelope(value: unknown): value is ResponseEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'message' in value &&
    'data' in value
  );
}

/**
 * Enrich a handler's return value into the full HTTP wire envelope (N9): if it is
 * already a core envelope (from `ok()`), keep its fields and add `path`/`timestamp`;
 * otherwise wrap the raw value as a success envelope. Used by the response interceptor.
 */
export function toHttpEnvelope(
  value: unknown,
  path: string,
  timestamp: string,
): HttpResponseEnvelope<unknown> {
  if (isCoreEnvelope(value)) {
    return { ...value, path, timestamp };
  }
  return { success: true, message: 'OK', data: value, path, timestamp };
}

/** Build the full HTTP error envelope (N9) — used by the exception filter. */
export function failHttp(
  message: string,
  path: string,
  timestamp: string,
): HttpResponseEnvelope<null> {
  return { success: false, message, data: null, path, timestamp };
}
