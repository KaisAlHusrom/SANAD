import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ApiError } from '../types/api-error.types';

/** Pull the envelope `message` from an error body, if present. */
function envelopeMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return null;
}

/**
 * Map RTK Query's `FetchBaseQueryError` to the app's `ApiError` — the ONE place the
 * standard error message is extracted (F1). HTTP errors read the envelope message;
 * transport/parse/timeout errors become `status: 0` with the RTK kind.
 */
export function toApiError(error: FetchBaseQueryError): ApiError {
  if (typeof error.status === 'number') {
    return {
      status: error.status,
      message:
        envelopeMessage(error.data) ?? `Request failed (${error.status})`,
    };
  }
  // FETCH_ERROR | TIMEOUT_ERROR | PARSING_ERROR | CUSTOM_ERROR
  return {
    status: 0,
    kind: error.status,
    message: 'error' in error && error.error ? error.error : 'Network error',
  };
}
