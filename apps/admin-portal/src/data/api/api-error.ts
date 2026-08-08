import type { ApiError } from '../types/api-error.types';

/**
 * Is this the normalized `ApiError` that `transform-error.ts` produces? (U3 — the ONE place that
 * answers it; six near-identical copies had grown across hooks before this was extracted.)
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

/**
 * The message to show for a caught error.
 *
 * The backend renders its own messages in the caller's locale (U24), so a real server message
 * beats any generic string we could invent — the fallback is only for a failure that never
 * reached the server, or one that answered without a message.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return (isApiError(error) && error.message) || fallback;
}
