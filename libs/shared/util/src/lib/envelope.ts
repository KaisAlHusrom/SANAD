import type { ResponseEnvelope } from '@sanad/contracts';

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
