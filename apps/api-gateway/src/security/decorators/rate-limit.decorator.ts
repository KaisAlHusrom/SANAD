import { SetMetadata } from '@nestjs/common';
import type { RateLimitPolicyId } from '@sanad/contracts';

/** Metadata key the `RateLimitGuard` reads a route's policy from. */
export const RATE_LIMIT_METADATA_KEY = 'sanad:rate-limit-policy';

/**
 * Declare which rate-limit bucket a route counts against. Undecorated routes use `default`;
 * `none` exempts entirely (health checks, which must stay answerable even with Redis down).
 * Mirrors `RequirePermissions` — a bare `SetMetadata`, enforced by the guard.
 */
export const RateLimit = (
  policy: RateLimitPolicyId,
): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, policy);
