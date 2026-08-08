import { DEFAULT_LOCALE, LOCALE_HEADER, type Locale } from '@sanad/contracts';
import { env } from '../../config/env/env';

/**
 * The SINGLE place the website unwraps the N9 wire envelope `{ success, message, data }`
 * and surfaces a standard error (F1). Every server-component read and the public lead
 * POST go through here. Reads through nginx at the in-cluster gateway base (U19); GET
 * reads opt into Next's data cache via `revalidate` + `tags`, the lead POST opts out
 * with `cache: 'no-store'`.
 */
export interface FetchOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Next.js ISR window in seconds (omit for the default), or `false` to never revalidate. */
  revalidate?: number | false;
  /** Next.js cache tags for on-demand revalidation (e.g. after an admin edit). */
  tags?: string[];
  cache?: RequestCache;
  /** Abort the request after this many ms (MS2 spirit: reads must not hang). */
  timeoutMs?: number;
  /**
   * The language the backend must answer in (U24c) — sent on every request as
   * `x-sanad-locale`. Defaults to `ar` (U8), which is also the site's default; the paths whose
   * message a VISITOR actually sees (the lead POST) pass the page's own locale.
   */
  locale?: Locale;
}

// Sits just under the gateway's own 5s RMQ read cap (MS2): a wedged upstream aborts the
// RSC fetch fast so the page degrades to its coded/empty fallback (F7) instead of hanging
// long enough for nginx to 504. A dead gateway refuses the connection and throws even
// sooner — callers MUST catch (see the data layer), so no single read can 500 a page.
const DEFAULT_TIMEOUT_MS = 4000;

export async function fetchEnvelope<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    revalidate,
    tags,
    cache,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    locale = DEFAULT_LOCALE,
  } = options;

  const url = `${env.gatewayBaseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const init: RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] };
  } = {
    method,
    signal: controller.signal,
    // THE one place the website tells the backend which language to answer in (U24c).
    headers: { [LOCALE_HEADER]: locale },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = {
      ...(init.headers as Record<string, string>),
      'content-type': 'application/json',
    };
  }
  if (cache) init.cache = cache;
  if (revalidate !== undefined || tags) {
    init.next = {};
    if (revalidate !== undefined) init.next.revalidate = revalidate;
    if (tags) init.next.tags = tags;
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  const envelope = (await response.json()) as {
    success: boolean;
    message: string;
    data: T;
  };
  if (!envelope.success) {
    throw new Error(envelope.message || `Request to ${path} was unsuccessful`);
  }
  return envelope.data;
}
