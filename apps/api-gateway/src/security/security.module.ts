import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './guards/index.js';
import { RateLimitPolicyResolver } from './resolvers/index.js';

/**
 * The gateway's edge protection (P8.10.A). Needs no `imports`: `CoreModule` (the settings RMQ
 * client + `DateTimeService`) and `CacheModule` (the `RateLimitCounter`) are both `@Global`.
 *
 * `APP_GUARD` is the platform's FIRST global guard — it now runs ahead of every route in the
 * product. That blast radius is bounded deliberately: `@RateLimit('none')` opts a route out
 * entirely, and the guard allows the request on all four of its failure paths.
 */
@Module({
  providers: [
    RateLimitPolicyResolver,
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [RateLimitPolicyResolver],
})
export class SecurityModule {}
