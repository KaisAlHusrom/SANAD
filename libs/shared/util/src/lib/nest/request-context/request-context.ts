import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_ID_HEADER,
  type RequestContext,
} from '@sanad/contracts';

/** The minimal Express-request shape this derivation reads. Structural, so tests pass literals. */
export interface HttpRequestLike {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * A request id lands in audit rows and log lines, so an inbound one is sanitised rather than
 * trusted — the header is caller-controlled on a public edge.
 */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function firstHeader(
  headers: HttpRequestLike['headers'],
  name: string,
): string | null {
  const raw = headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
}

/** `::ffff:1.2.3.4` and `1.2.3.4` are one client — two forms would mean two rate-limit buckets. */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(trimmed);
  return (mapped?.[1] ?? trimmed).toLowerCase();
}

/**
 * The caller's address. `request.ip` FIRST: under `trust proxy` Express resolves it to the
 * rightmost entry the proxy chain did not add, which is the one value a client cannot forge.
 * `x-forwarded-for`'s first hop is caller-supplied (nginx *appends*), so it is only a fallback
 * for a request object Express never touched — a unit-test literal, or a service with no
 * trust-proxy setting of its own.
 */
export function clientIpOf(request: HttpRequestLike): string | null {
  const direct = request.ip?.trim();
  if (direct) {
    return normalizeIp(direct);
  }
  const forwarded = firstHeader(request.headers, 'x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) {
    return normalizeIp(first);
  }
  const socket = request.socket?.remoteAddress?.trim();
  return socket ? normalizeIp(socket) : null;
}

export function sanitizeRequestId(value: string | null): string | null {
  return value !== null && REQUEST_ID_PATTERN.test(value) ? value : null;
}

/**
 * Derive **from where** a request came, for the audit trail and the rate limiter alike (P8.10.A).
 *
 * A pure function of the request rather than an ALS read on purpose: `@sanad/audit` runs inside
 * services that never install the gateway's middleware, and a shared `currentRequestContext()`
 * would silently hand them the empty context. This degrades honestly instead — and keeps the
 * limiter and the audit row keyed on the SAME address, so a 429 and its trail can never disagree.
 */
export function requestContextFromHttp(
  request: HttpRequestLike,
): RequestContext {
  return {
    ...EMPTY_REQUEST_CONTEXT,
    ip: clientIpOf(request),
    userAgent: firstHeader(request.headers, 'user-agent'),
    requestId: sanitizeRequestId(
      firstHeader(request.headers, REQUEST_ID_HEADER),
    ),
  };
}
