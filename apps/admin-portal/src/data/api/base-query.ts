import {
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
} from '@reduxjs/toolkit/query';
import { LOCALE_HEADER, resolveLocale, type TokenPair } from '@sanad/contracts';
import { env } from '../../config/env';
import { i18n } from '../../i18n/i18n';
import {
  loggedOut,
  selectAccessToken,
  selectRefreshToken,
  tokensRefreshed,
} from '../auth/auth.slice';
import type { AuthRoot } from '../auth/auth-state.types';
import type { ApiError } from '../types/api-error.types';
import { toApiError } from './transform-error';

const REFRESH_URL = '/auth/refresh';
// A 401 from these endpoints is the credential/session itself failing — refreshing
// would be wrong (and pointless). `/auth/me` is intentionally NOT here: a 401 there
// means an expired access token, which SHOULD refresh + retry.
const NO_REFRESH_URLS = new Set([REFRESH_URL, '/auth/login', '/auth/logout']);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as AuthRoot);
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    // THE one place the portal tells the backend which language to answer in (U24c). The
    // in-app language is authoritative over the device/browser (F11), so it is sent
    // explicitly on every request — including `ar`, which the backend must never have to guess.
    headers.set(LOCALE_HEADER, resolveLocale(i18n.language));
    return headers;
  },
});

type RawExtraOptions = Parameters<typeof rawBaseQuery>[2];

/** Unwrap the gateway envelope `{ success, message, data }` → `data` (F1, one place). */
function unwrapEnvelope(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function tokenPairFrom(payload: unknown): TokenPair | null {
  const data = unwrapEnvelope(payload);
  if (
    data &&
    typeof data === 'object' &&
    'access' in data &&
    'refresh' in data
  ) {
    const { access, refresh } = data as { access: unknown; refresh: unknown };
    if (typeof access === 'string' && typeof refresh === 'string') {
      return { access, refresh };
    }
  }
  return null;
}

function requestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

// Single-flight refresh: concurrent 401s share ONE refresh round-trip.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(
  api: BaseQueryApi,
  extraOptions: RawExtraOptions,
): Promise<boolean> {
  const refresh = selectRefreshToken(api.getState() as AuthRoot);
  if (!refresh) {
    api.dispatch(loggedOut());
    return false;
  }
  const result = await rawBaseQuery(
    { url: REFRESH_URL, method: 'POST', body: { refresh } },
    api,
    extraOptions,
  );
  const pair = result.data ? tokenPairFrom(result.data) : null;
  if (!pair) {
    api.dispatch(loggedOut());
    return false;
  }
  api.dispatch(tokensRefreshed(pair));
  return true;
}

function ensureRefreshed(
  api: BaseQueryApi,
  extraOptions: RawExtraOptions,
): Promise<boolean> {
  refreshInFlight ??= refreshTokens(api, extraOptions).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * The portal's base query (F1/W3): attaches the bearer token, unwraps the envelope in
 * ONE place, and on 401 runs a single-flight refresh + one retry — logging out if
 * refresh fails (no retry loop). Errors are normalized to `ApiError`.
 */
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  ApiError
> = async (args, api, extraOptions) => {
  // If a refresh is mid-flight, wait so this request uses the rotated token.
  if (refreshInFlight) {
    await refreshInFlight;
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !NO_REFRESH_URLS.has(requestUrl(args))) {
    const refreshed = await ensureRefreshed(api, extraOptions);
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  if (result.error) {
    return { error: toApiError(result.error) };
  }
  return { data: unwrapEnvelope(result.data) };
};
