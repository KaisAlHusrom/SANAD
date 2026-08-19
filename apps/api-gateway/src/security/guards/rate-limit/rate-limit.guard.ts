import {
  HttpStatus,
  Injectable,
  Logger,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitCounter, type RateLimitHit } from '@sanad/cache';
import type { RateLimitPolicy, RateLimitPolicyId } from '@sanad/contracts';
import { httpError } from '@sanad/i18n';
import { currentRequestContext } from '../../../core/middlewares/index.js';
import { RATE_LIMIT_METADATA_KEY } from '../../decorators/index.js';
import {
  RATE_LIMIT_KEY_PREFIX,
  RATE_LIMIT_REDIS_TIMEOUT_MS,
} from '../../rate-limit.constants.js';
import { RateLimitPolicyResolver } from '../../resolvers/index.js';

/** The response surface the guard writes its headers to. */
interface LimitedResponse {
  setHeader(name: string, value: string): void;
}

const TIMED_OUT = Symbol('rate-limit-timeout');

/**
 * The edge rate limiter (P8.10.A) — the platform's first global guard.
 *
 * Registered as `APP_GUARD`, so it runs **before** any route-level `@UseGuards`: a flood is
 * rejected before JWT verification, which is the cheap path. That also means no identity is
 * attached yet, which is why the bucket is keyed on the caller's address alone.
 *
 * It reads that address from the ALS scope `requestContextMiddleware` opens — the SAME value the
 * audit row records, so a 429 and its trail can never disagree about who was calling. That works
 * only because the middleware is registered with `app.use` ahead of the router; a Nest middleware
 * bound per-route would not wrap the guard.
 *
 * **It fails open on every path.** Redis rejecting, Redis hanging, settings unreachable, an
 * unknown address — each allows the request. A rate limiter that can refuse legitimate traffic
 * because of its own dependencies has become the outage it was meant to prevent.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly policies: RateLimitPolicyResolver,
    private readonly counter: RateLimitCounter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const policyId =
      this.reflector.getAllAndOverride<RateLimitPolicyId | undefined>(
        RATE_LIMIT_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'default';

    if (policyId === 'none') {
      return true;
    }

    const settings = this.policies.current();
    if (!settings.enabled) {
      return true;
    }

    // No address means no bucket. Lumping every unidentifiable caller together would let a
    // handful of them lock out everyone else — a self-inflicted denial of service.
    const ip = currentRequestContext().ip;
    if (ip === null) {
      return true;
    }

    const policy = settings.policies[policyId];
    const hit = await this.count(
      `${RATE_LIMIT_KEY_PREFIX}:${policyId}:${ip}`,
      policy,
    );
    if (hit === null) {
      return true;
    }

    const response = context.switchToHttp().getResponse<LimitedResponse>();
    const seconds = Math.max(1, Math.ceil(hit.resetInMs / 1000));

    // Sent on the rejection too, not only the success — a caller that is being limited is
    // exactly the one that needs to see the ceiling and the reset.
    response.setHeader('X-RateLimit-Limit', String(policy.limit));
    response.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, policy.limit - hit.count)),
    );
    response.setHeader('X-RateLimit-Reset', String(seconds));

    if (hit.count > policy.limit) {
      response.setHeader('Retry-After', String(seconds));
      throw httpError(HttpStatus.TOO_MANY_REQUESTS, 'security.rateLimited', {
        seconds,
      });
    }
    return true;
  }

  /** Count the request, or `null` when Redis could not answer in time — i.e. allow it. */
  private async count(
    key: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitHit | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        this.counter.hit(key, policy.windowSeconds * 1000),
        new Promise<typeof TIMED_OUT>((resolve) => {
          timer = setTimeout(
            () => resolve(TIMED_OUT),
            RATE_LIMIT_REDIS_TIMEOUT_MS,
          );
        }),
      ]);
      if (result === TIMED_OUT) {
        this.logger.warn(
          `rate limiting skipped: redis did not answer within ${RATE_LIMIT_REDIS_TIMEOUT_MS}ms`,
        );
        return null;
      }
      return result;
    } catch (error) {
      this.logger.warn(
        `rate limiting skipped: ${String(
          error instanceof Error ? error.message : error,
        )}`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
