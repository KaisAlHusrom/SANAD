import type { ExecutionContext } from '@nestjs/common';
import { HttpException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_DEFAULTS, type RateLimitPolicyId } from '@sanad/contracts';
import type { RateLimitCounter, RateLimitHit } from '@sanad/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestContextMiddleware } from '../../../core/middlewares/index.js';
import type { RateLimitPolicyResolver } from '../../resolvers/index.js';
import { RATE_LIMIT_REDIS_TIMEOUT_MS } from '../../rate-limit.constants.js';
import { RateLimitGuard } from './rate-limit.guard.js';

interface Headers {
  [name: string]: string | string[] | undefined;
}

/**
 * ONE request object, seen by both the middleware and the ExecutionContext — as in production.
 * An earlier version of this helper built two, which let a guard reading the raw
 * `x-forwarded-for` off the request pass the spoof test: the forged header was only ever on the
 * object the guard could not see. A probe caught it. Keep them the same object.
 */
function contextFor(request: { ip?: string; headers?: Headers }): {
  context: ExecutionContext;
  req: { ip?: string; headers: Headers };
  setHeader: ReturnType<typeof vi.fn>;
} {
  const setHeader = vi.fn();
  const req = { ip: request.ip, headers: request.headers ?? {} };
  const context = {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ExecutionContext;
  return { context, req, setHeader };
}

function reflectorFor(policy: RateLimitPolicyId | undefined): Reflector {
  return {
    getAllAndOverride: () => policy,
  } as unknown as Reflector;
}

function resolverFor(
  overrides: {
    enabled?: boolean;
    policies?: Partial<typeof RATE_LIMIT_DEFAULTS>;
  } = {},
): RateLimitPolicyResolver {
  return {
    current: () => ({
      enabled: overrides.enabled ?? true,
      policies: { ...RATE_LIMIT_DEFAULTS, ...overrides.policies },
    }),
  } as unknown as RateLimitPolicyResolver;
}

function counterFor(
  hit: (key: string, windowMs: number) => Promise<RateLimitHit>,
): { counter: RateLimitCounter; keys: string[] } {
  const keys: string[] = [];
  const counter = {
    hit: (key: string, windowMs: number) => {
      keys.push(key);
      return hit(key, windowMs);
    },
  } as unknown as RateLimitCounter;
  return { counter, keys };
}

const counting = (start = 1) => {
  const counts = new Map<string, number>();
  return (key: string, windowMs: number): Promise<RateLimitHit> => {
    const count = (counts.get(key) ?? start - 1) + 1;
    counts.set(key, count);
    return Promise.resolve({ count, resetInMs: windowMs });
  };
};

/**
 * Every case runs inside the real middleware, not a stubbed ALS — the guard reads the caller's
 * ip from the scope the middleware opens, so faking that away would prove nothing about the
 * arrangement that actually ships.
 */
async function guarded(
  guard: RateLimitGuard,
  ctx: ReturnType<typeof contextFor>,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    requestContextMiddleware(
      ctx.req as never,
      { setHeader: () => undefined } as never,
      () => {
        guard.canActivate(ctx.context).then(resolve, reject);
      },
    );
  });
}

describe('RateLimitGuard', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets a caller under the limit through and reports their standing', async () => {
    const { counter } = counterFor(counting());
    const ctx = contextFor({ ip: '1.2.3.4' });
    const guard = new RateLimitGuard(
      reflectorFor('lead'),
      resolverFor(),
      counter,
    );
    expect(await guarded(guard, ctx)).toBe(true);
    expect(ctx.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      String(RATE_LIMIT_DEFAULTS.lead.limit),
    );
    expect(ctx.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      String(RATE_LIMIT_DEFAULTS.lead.limit - 1),
    );
    expect(ctx.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '3600');
  });

  it('rejects the request past the limit with a catalogued 429 and a Retry-After', async () => {
    const { counter } = counterFor(() =>
      Promise.resolve({ count: 3, resetInMs: 42_000 }),
    );
    const ctx = contextFor({ ip: '1.2.3.4' });
    const guard = new RateLimitGuard(
      reflectorFor('lead'),
      resolverFor({ policies: { lead: { limit: 2, windowSeconds: 60 } } }),
      counter,
    );
    const error = await guarded(guard, ctx).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    const thrown = error as HttpException;
    expect(thrown.getStatus()).toBe(429);
    expect(thrown.getResponse()).toMatchObject({
      messageKey: 'security.rateLimited',
      params: { seconds: 42 },
    });
    expect(ctx.setHeader).toHaveBeenCalledWith('Retry-After', '42');
    // The caller being limited is the one that most needs to see the ceiling.
    expect(ctx.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '2');
    expect(ctx.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
  });

  // Separate buckets: a flood on login must not consume the budget a real visitor needs to
  // submit a lead from the same address.
  it('keys each policy into its own bucket', async () => {
    const { counter, keys } = counterFor(counting());
    for (const policy of ['auth', 'lead'] as const) {
      const ctx = contextFor({ ip: '1.2.3.4' });
      await guarded(
        new RateLimitGuard(reflectorFor(policy), resolverFor(), counter),
        ctx,
      );
    }
    expect(keys).toEqual(['rl:v1:auth:1.2.3.4', 'rl:v1:lead:1.2.3.4']);
  });

  it('falls back to the default policy on an undecorated route', async () => {
    const { counter, keys } = counterFor(counting());
    const ctx = contextFor({ ip: '1.2.3.4' });
    await guarded(
      new RateLimitGuard(reflectorFor(undefined), resolverFor(), counter),
      ctx,
    );
    expect(keys).toEqual(['rl:v1:default:1.2.3.4']);
  });

  // Health must stay green even with Redis down, or the container healthcheck kills a gateway
  // that is in fact serving traffic perfectly well.
  it('never touches Redis for an exempt route', async () => {
    const hit = vi.fn();
    const ctx = contextFor({ ip: '1.2.3.4' });
    const guard = new RateLimitGuard(reflectorFor('none'), resolverFor(), {
      hit,
    } as unknown as RateLimitCounter);
    expect(await guarded(guard, ctx)).toBe(true);
    expect(hit).not.toHaveBeenCalled();
  });

  it('never touches Redis when the kill switch is off', async () => {
    const hit = vi.fn();
    const ctx = contextFor({ ip: '1.2.3.4' });
    const guard = new RateLimitGuard(
      reflectorFor('lead'),
      resolverFor({ enabled: false }),
      { hit } as unknown as RateLimitCounter,
    );
    expect(await guarded(guard, ctx)).toBe(true);
    expect(hit).not.toHaveBeenCalled();
  });

  it('fails OPEN and warns when Redis rejects', async () => {
    const { counter } = counterFor(() => Promise.reject(new Error('READONLY')));
    const ctx = contextFor({ ip: '1.2.3.4' });
    const guard = new RateLimitGuard(
      reflectorFor('lead'),
      resolverFor(),
      counter,
    );
    expect(await guarded(guard, ctx)).toBe(true);
    expect(logSpy).toHaveBeenCalledOnce();
  });

  /**
   * The load-bearing one. `CacheModule` sets `maxRetriesPerRequest: null`, so a dead Redis
   * QUEUES commands rather than failing them — without this deadline the edge would hang
   * instead of failing open. Do not delete this test with the race.
   */
  it('fails OPEN when Redis hangs rather than hanging the request', async () => {
    vi.useFakeTimers();
    try {
      const { counter } = counterFor(
        () => new Promise<RateLimitHit>(() => undefined),
      );
      const ctx = contextFor({ ip: '1.2.3.4' });
      const guard = new RateLimitGuard(
        reflectorFor('lead'),
        resolverFor(),
        counter,
      );
      const pending = guarded(guard, ctx);
      await vi.advanceTimersByTimeAsync(RATE_LIMIT_REDIS_TIMEOUT_MS + 1);
      expect(await pending).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  // Lumping every unidentifiable caller into one shared bucket would let a handful of them
  // lock out everyone else — a self-inflicted denial of service.
  it('allows a caller whose address we could not determine', async () => {
    const hit = vi.fn();
    const ctx = contextFor({});
    const guard = new RateLimitGuard(reflectorFor('lead'), resolverFor(), {
      hit,
    } as unknown as RateLimitCounter);
    expect(await guarded(guard, ctx)).toBe(true);
    expect(hit).not.toHaveBeenCalled();
  });

  it('treats a v4-mapped address and its plain form as one caller', async () => {
    const { counter, keys } = counterFor(counting());
    for (const ip of ['::ffff:1.2.3.4', '1.2.3.4']) {
      const ctx = contextFor({ ip });
      await guarded(
        new RateLimitGuard(reflectorFor('lead'), resolverFor(), counter),
        ctx,
      );
    }
    expect(new Set(keys).size).toBe(1);
  });

  /**
   * The bypass this phase exists to close. nginx APPENDS to x-forwarded-for, so a caller can
   * put anything in the first hop; if the guard keyed on that, one client would get a fresh
   * bucket per request and the limit would be decorative.
   */
  it('ignores a forged x-forwarded-for when Express resolved a real ip', async () => {
    const { counter, keys } = counterFor(counting());
    for (const forged of ['9.9.9.1', '9.9.9.2', '9.9.9.3']) {
      const ctx = contextFor({
        ip: '1.2.3.4',
        headers: { 'x-forwarded-for': `${forged}, 1.2.3.4` },
      });
      await guarded(
        new RateLimitGuard(reflectorFor('lead'), resolverFor(), counter),
        ctx,
      );
    }
    expect(new Set(keys)).toEqual(new Set(['rl:v1:lead:1.2.3.4']));
  });

  it('reads the policy from the handler first, then the class', async () => {
    const getAllAndOverride = vi.fn().mockReturnValue('auth');
    const { counter } = counterFor(counting());
    const ctx = contextFor({ ip: '1.2.3.4' });
    await guarded(
      new RateLimitGuard(
        { getAllAndOverride } as unknown as Reflector,
        resolverFor(),
        counter,
      ),
      ctx,
    );
    const [, targets] = getAllAndOverride.mock.calls[0] ?? [];
    expect(Array.isArray(targets) && targets.length).toBe(2);
  });
});
