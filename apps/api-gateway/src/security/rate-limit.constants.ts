/**
 * How long a resolved policy snapshot is served before a background refresh is scheduled.
 * One minute is short enough that an operator tightening a limit mid-campaign sees it take
 * effect while they are still watching, and long enough that the broker is not in the request
 * path in any practical sense.
 */
export const RATE_LIMIT_SETTINGS_TTL_MS = 60_000;

/**
 * The hard deadline on the Redis round trip. `CacheModule` builds its client with
 * `maxRetriesPerRequest: null`, which queues commands **forever** across reconnects — right for
 * a cache, catastrophic for a guard that runs on every request. Without this race a dead Redis
 * would hang the edge instead of failing open. It also caps the latency the limiter can add.
 */
export const RATE_LIMIT_REDIS_TIMEOUT_MS = 100;

/** Versioned so a future change of window algorithm cannot read counters shaped for the old one. */
export const RATE_LIMIT_KEY_PREFIX = 'rl:v1';
