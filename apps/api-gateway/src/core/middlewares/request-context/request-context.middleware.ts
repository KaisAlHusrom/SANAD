import { AsyncLocalStorage } from 'node:async_hooks';
import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_ID_HEADER,
  type RequestContext,
} from '@sanad/contracts';

/** Minimal shape of the Express request/response this middleware touches. */
interface ContextRequest {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

const storage = new AsyncLocalStorage<RequestContext>();

function firstHeader(
  headers: ContextRequest['headers'],
  name: string,
): string | null {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === undefined || value.length === 0 ? null : value;
}

/**
 * The client's address. `x-forwarded-for` is a chain (`client, proxy1, proxy2`) and the FIRST
 * hop is the caller — reading Express's `req.ip` alone behind our own nginx would record the
 * proxy's address on every audit row, which is the same as recording nothing.
 */
function clientIp(request: ContextRequest): string | null {
  const forwarded = firstHeader(request.headers, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.ip ?? request.socket?.remoteAddress ?? null;
}

/**
 * Runs the rest of the request inside an `AsyncLocalStorage` scope carrying **who is calling
 * from where** (P8.8). Express middleware rather than a Nest interceptor on purpose: an
 * interceptor's `next.handle()` is *subscribed* after `intercept()` returns, so the controller
 * would execute outside any scope opened around it — `app.use` wraps the whole downstream chain,
 * guards and RMQ sends included.
 *
 * Reading it from ALS instead of threading a parameter is what makes this complete: `forwardHeaders`
 * is the ONE place gateway→service headers are built (~26 call sites), so every call carries the
 * context and no later phase has to revisit a route to make `@Audited()` work.
 */
export function requestContextMiddleware(
  request: ContextRequest,
  _response: unknown,
  next: () => void,
): void {
  const context: RequestContext = {
    ip: clientIp(request),
    userAgent: firstHeader(request.headers, 'user-agent'),
    // P8.10 generates one when absent; until then an edge-supplied id is honoured and the
    // field is honestly null rather than fabricated.
    requestId: firstHeader(request.headers, REQUEST_ID_HEADER),
  };
  storage.run(context, next);
}

/**
 * The context of the request in flight, or {@link EMPTY_REQUEST_CONTEXT} outside one (a boot-time
 * call, a scheduled job, a test). Never `undefined` — callers must not have to guard.
 */
export function currentRequestContext(): RequestContext {
  return storage.getStore() ?? EMPTY_REQUEST_CONTEXT;
}
