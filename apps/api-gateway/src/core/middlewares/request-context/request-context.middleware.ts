import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_ID_HEADER,
  type RequestContext,
} from '@sanad/contracts';
import { requestContextFromHttp, type HttpRequestLike } from '@sanad/util';

/** The response surface this middleware touches — structural, so specs pass plain objects. */
interface ContextResponse {
  setHeader(name: string, value: string): void;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Runs the rest of the request inside an `AsyncLocalStorage` scope carrying **who is calling
 * from where** (P8.8). Express middleware rather than a Nest interceptor on purpose: an
 * interceptor's `next.handle()` is *subscribed* after `intercept()` returns, so the controller
 * would execute outside any scope opened around it — `app.use` wraps the whole downstream chain,
 * guards and RMQ sends included. Registered before the router, so the global rate-limit guard is
 * always inside the scope it reads the caller's ip from.
 *
 * Reading it from ALS instead of threading a parameter is what makes this complete: `forwardHeaders`
 * is the ONE place gateway→service headers are built (~26 call sites), so every call carries the
 * context and no later phase has to revisit a route to make `@Audited()` work.
 *
 * The id is **generated when absent** (P8.10.A) and stamped back onto the request headers, which
 * is how the audit interceptor's HTTP branch — which reads the request, not this scope — sees it.
 */
export function requestContextMiddleware(
  request: HttpRequestLike,
  response: ContextResponse,
  next: () => void,
): void {
  const derived = requestContextFromHttp(request);
  const requestId = derived.requestId ?? randomUUID();

  // Mutated in place, not replaced: Express hands the same `req.headers` object to every
  // downstream middleware, and swapping it would orphan any reference already taken.
  if (request.headers) {
    request.headers[REQUEST_ID_HEADER] = requestId;
  } else {
    request.headers = { [REQUEST_ID_HEADER]: requestId };
  }
  response.setHeader(REQUEST_ID_HEADER, requestId);

  storage.run({ ...derived, requestId }, next);
}

/**
 * The context of the request in flight, or {@link EMPTY_REQUEST_CONTEXT} outside one (a boot-time
 * call, a scheduled job, a test). Never `undefined` — callers must not have to guard.
 */
export function currentRequestContext(): RequestContext {
  return storage.getStore() ?? EMPTY_REQUEST_CONTEXT;
}
