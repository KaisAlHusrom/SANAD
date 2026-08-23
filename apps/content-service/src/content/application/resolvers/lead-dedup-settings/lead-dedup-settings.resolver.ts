import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  LEAD_DEDUP_DEFAULTS,
  LEAD_DEDUP_SETTING_KEYS,
  LEAD_DEDUP_WINDOW_BOUNDS,
  SECURITY_GROUP,
  SETTINGS_RESOLVE_GROUP,
  type LeadDedupSettings,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { SETTINGS_CLIENT } from '../../../../core/injection-tokens.js';

/**
 * Far below `sendRequest`'s 5 s default, and deliberately so: this lookup sits INSIDE the
 * gateway's own 5 s budget for `content.lead.submit`. At the default, one unreachable
 * settings-service consumed the entire outer budget, so the gateway timed out and returned
 * **500 for a lead that had in fact been saved** — the visitor is told to try again and
 * resubmits. A window is not worth a second of anyone's patience: if settings cannot answer
 * quickly, the coded default is the right answer.
 */
const DEDUP_SETTINGS_TIMEOUT_MS = 800;

function boundedInteger(
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
 * The duplicate-detection window, resolved live from the `security` settings group (U9/F7).
 *
 * Deliberately **awaiting**, unlike the gateway's `RateLimitPolicyResolver`: that one returns a
 * cached snapshot because it runs on every single request, whereas this runs once per lead
 * submission behind a 20/hour/ip bucket. One RMQ round trip there is cheap, and awaiting means
 * an operator's change takes effect on the next submission rather than up to a TTL later.
 *
 * Every failure resolves to the coded defaults rather than to an outage: an unreachable settings
 * service, a missing key, or a value outside its declared bounds each fall back per key. Losing
 * a real lead because a setting could not be read would be far worse than folding one too many.
 */
@Injectable()
export class LeadDedupSettingsResolver {
  private readonly logger = new Logger(LeadDedupSettingsResolver.name);

  constructor(@Inject(SETTINGS_CLIENT) private readonly client: ClientProxy) {}

  async current(): Promise<LeadDedupSettings> {
    try {
      const values = await sendRequest<Record<string, unknown>>(
        this.client,
        SETTINGS_RESOLVE_GROUP,
        { group: SECURITY_GROUP },
        { timeoutMs: DEDUP_SETTINGS_TIMEOUT_MS },
      );
      return this.toSettings(values ?? {});
    } catch (error) {
      this.logger.warn(
        `lead dedup settings unresolved, using the coded defaults: ${String(
          error instanceof Error ? error.message : error,
        )}`,
      );
      return LEAD_DEDUP_DEFAULTS;
    }
  }

  private toSettings(values: Record<string, unknown>): LeadDedupSettings {
    const enabled = values[LEAD_DEDUP_SETTING_KEYS.enabled];
    return {
      enabled:
        typeof enabled === 'boolean' ? enabled : LEAD_DEDUP_DEFAULTS.enabled,
      windowSeconds: boundedInteger(
        values[LEAD_DEDUP_SETTING_KEYS.windowSeconds],
        LEAD_DEDUP_WINDOW_BOUNDS,
        LEAD_DEDUP_DEFAULTS.windowSeconds,
      ),
    };
  }
}
