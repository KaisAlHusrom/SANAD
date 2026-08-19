import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  COUNTED_RATE_LIMIT_POLICIES,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  RATE_LIMIT_LIMIT_BOUNDS,
  RATE_LIMIT_WINDOW_BOUNDS,
  SECURITY_GROUP,
  SECURITY_SETTING_KEYS,
  SETTINGS_RESOLVE_GROUP,
  rateLimitSettingKeys,
  type CountedRateLimitPolicyId,
  type RateLimitPolicy,
} from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import { sendRequest } from '@sanad/messaging';
import { SETTINGS_CLIENT } from '../../../core/injection-tokens.js';
import { RATE_LIMIT_SETTINGS_TTL_MS } from '../../rate-limit.constants.js';

/** The limiter's whole configuration at one instant. */
export interface RateLimitSettings {
  enabled: boolean;
  policies: Readonly<Record<CountedRateLimitPolicyId, RateLimitPolicy>>;
}

const CODED_DEFAULTS: RateLimitSettings = {
  enabled: RATE_LIMIT_ENABLED_DEFAULT,
  policies: RATE_LIMIT_DEFAULTS,
};

function boundedNumber(
  value: unknown,
  bounds: { min: number; max: number },
  fallback: number,
): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= bounds.min &&
    value <= bounds.max
    ? value
    : fallback;
}

/**
 * The gateway's live view of the `security` settings group (U9/F7).
 *
 * `current()` is **synchronous by design**: it returns the last-good snapshot and *schedules* a
 * refresh when the TTL has lapsed. The awaiting shape used by `SmtpEmailProvider` is right for a
 * send path, but this runs on every single request — awaiting would make one request per minute
 * pay an RMQ round trip (up to the 5 s send timeout) for a value that changes almost never.
 *
 * Every failure mode resolves to *less strict*, never to an outage: an unreachable broker keeps
 * the last good snapshot (cold start: the coded defaults), and any value that is not a sane
 * integer falls back per key — so an admin typing `0` into a limit field cannot lock the product
 * out, it just stops tightening that one bucket.
 */
@Injectable()
export class RateLimitPolicyResolver {
  private readonly logger = new Logger(RateLimitPolicyResolver.name);
  private snapshot: RateLimitSettings = CODED_DEFAULTS;
  private resolvedAtMs: number | null = null;
  private inFlight = false;

  constructor(
    @Inject(SETTINGS_CLIENT) private readonly client: ClientProxy,
    private readonly clock: DateTimeService,
  ) {}

  current(): RateLimitSettings {
    if (this.isStale()) {
      void this.refresh();
    }
    return this.snapshot;
  }

  private isStale(): boolean {
    if (this.inFlight) {
      return false;
    }
    return (
      this.resolvedAtMs === null ||
      this.clock.nowMillis() - this.resolvedAtMs >= RATE_LIMIT_SETTINGS_TTL_MS
    );
  }

  private async refresh(): Promise<void> {
    this.inFlight = true;
    try {
      const values = await sendRequest<Record<string, unknown>>(
        this.client,
        SETTINGS_RESOLVE_GROUP,
        { group: SECURITY_GROUP },
      );
      this.snapshot = this.toSettings(values ?? {});
      this.resolvedAtMs = this.clock.nowMillis();
    } catch (error) {
      // Settings unreachable / no responder — the last good snapshot stands. Deliberately NOT
      // reverting to the coded defaults: that would silently undo an operator's tightening at
      // exactly the moment they most likely tightened it.
      this.logger.warn(
        `rate-limit settings unresolved, keeping the last known values: ${String(
          error instanceof Error ? error.message : error,
        )}`,
      );
      this.resolvedAtMs = this.clock.nowMillis();
    } finally {
      this.inFlight = false;
    }
  }

  private toSettings(values: Record<string, unknown>): RateLimitSettings {
    const enabledValue = values[SECURITY_SETTING_KEYS.enabled];
    const policies = {} as Record<CountedRateLimitPolicyId, RateLimitPolicy>;

    for (const policy of COUNTED_RATE_LIMIT_POLICIES) {
      const keys = rateLimitSettingKeys(policy);
      const coded = RATE_LIMIT_DEFAULTS[policy];
      policies[policy] = {
        limit: boundedNumber(
          values[keys.limit],
          RATE_LIMIT_LIMIT_BOUNDS,
          coded.limit,
        ),
        windowSeconds: boundedNumber(
          values[keys.windowSeconds],
          RATE_LIMIT_WINDOW_BOUNDS,
          coded.windowSeconds,
        ),
      };
    }

    return {
      enabled:
        typeof enabledValue === 'boolean'
          ? enabledValue
          : RATE_LIMIT_ENABLED_DEFAULT,
      policies,
    };
  }
}
