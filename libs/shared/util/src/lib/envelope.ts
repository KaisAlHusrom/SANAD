import type { HttpResponseEnvelope, ResponseEnvelope } from '@sanad/contracts';

/**
 * Build a success envelope. The backend wraps every response in exactly one place
 * with these helpers; the frontend unwraps in one place (F1, U3).
 *
 * `messageKey` is a **catalog key, never prose** (U24) — the response interceptor renders it
 * into the caller's locale at the edge. Pass e.g. `'common.created'`, not `'Created'`.
 */
export function ok<T>(data: T, messageKey = 'common.ok'): ResponseEnvelope<T> {
  return { success: true, message: messageKey, data };
}

/** Build a failure envelope with no data payload. `messageKey` is a catalog key (U24). */
export function fail(messageKey: string): ResponseEnvelope<null> {
  return { success: false, message: messageKey, data: null };
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
 * otherwise wrap the raw value as a success envelope. Used by the response interceptor,
 * which then renders the `message` KEY into the caller's locale (U24).
 */
export function toHttpEnvelope(
  value: unknown,
  path: string,
  timestamp: string,
): HttpResponseEnvelope<unknown> {
  if (isCoreEnvelope(value)) {
    return { ...value, path, timestamp };
  }
  return { success: true, message: 'common.ok', data: value, path, timestamp };
}

/**
 * Build the full HTTP error envelope (N9) — used by the exception filter, which passes an
 * ALREADY-RENDERED message (it owns the translation step, U24). `errors` is the optional
 * field→message map a validation failure carries; omitted entirely when there is none, so a
 * normal error body keeps its exact five-field shape.
 */
export function failHttp(
  message: string,
  path: string,
  timestamp: string,
  errors?: Record<string, string>,
): HttpResponseEnvelope<null> {
  const envelope: HttpResponseEnvelope<null> = {
    success: false,
    message,
    data: null,
    path,
    timestamp,
  };
  return errors ? { ...envelope, errors } : envelope;
}
