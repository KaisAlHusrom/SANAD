import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { i18n } from '../../i18n/i18n';
import type { ApiError } from '../types/api-error.types';

/**
 * Pull the envelope's per-field validation messages, if present. They arrive **already
 * localized** (the backend renders the pipe's keys at the edge, U24), so a form can attach each
 * one to its field. `ApiError.fields` had no producer until the envelope started carrying them.
 */
function envelopeFields(data: unknown): Record<string, string> | undefined {
  if (!data || typeof data !== 'object' || !('errors' in data))
    return undefined;
  const errors = (data as { errors: unknown }).errors;
  if (!errors || typeof errors !== 'object') return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

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
 * standard error message is extracted (F1).
 *
 * An HTTP error's envelope `message` arrives **already localized** by the gateway (U24), so it
 * is used as-is. The two cases the backend never got to answer — a transport failure, and a
 * response with no envelope message — are localized **here**, from the portal's own catalog:
 * they are the failures a user is most likely to see offline, and they were the last English
 * strings in this layer (U8).
 */
export function toApiError(error: FetchBaseQueryError): ApiError {
  if (typeof error.status === 'number') {
    const fields = envelopeFields(error.data);
    const base = {
      status: error.status,
      message:
        envelopeMessage(error.data) ??
        i18n.t('common:errors.request', { status: error.status }),
    };
    return fields ? { ...base, fields } : base;
  }
  // FETCH_ERROR | TIMEOUT_ERROR | PARSING_ERROR | CUSTOM_ERROR — the request never completed,
  // so there is no backend message to render; RTK's own `error` string is developer text.
  return {
    status: 0,
    kind: error.status,
    message: i18n.t('common:errors.network'),
  };
}
