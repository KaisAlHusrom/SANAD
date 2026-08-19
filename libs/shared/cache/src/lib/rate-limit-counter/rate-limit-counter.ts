import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../cache.tokens.js';

/**
 * The Redis surface this counter needs. Declared separately from `RedisClient` rather than
 * widening it (U10): `RedisCache` is a JSON key/value store, this is a counting primitive, and
 * the two have no command in common beyond `incr`. An ioredis client satisfies it structurally.
 */
export interface RateLimitCounterClient {
  eval(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
}

/** One counted request: where the caller stands, and when their window resets. */
export interface RateLimitHit {
  count: number;
  resetInMs: number;
}

/**
 * A fixed window anchored at the first hit, in ONE round trip.
 *
 * `INCR` then `PEXPIRE` as two commands is the obvious version and it is wrong: if the process
 * dies between them the key survives with no TTL and that caller is blocked forever. Inside a
 * script the pair is atomic. Arming the expiry only when `count == 1` is what anchors the window
 * — re-arming on every hit would let a steady caller hold the key alive and never reset.
 *
 * Accepted trade-off, over a sliding-window log: a caller can burst up to 2× the limit across a
 * window boundary. A log costs four commands and unbounded per-key memory to buy precision no
 * limit here needs.
 */
const HIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return { count, redis.call('PTTL', KEYS[1]) }
`;

function parseHit(reply: unknown): RateLimitHit {
  if (!Array.isArray(reply) || reply.length < 2) {
    throw new Error(`rate-limit counter: unexpected reply ${String(reply)}`);
  }
  const [count, ttl] = reply;
  if (typeof count !== 'number' || typeof ttl !== 'number') {
    throw new Error(`rate-limit counter: unexpected reply ${String(reply)}`);
  }
  return { count, resetInMs: Math.max(0, ttl) };
}

@Injectable()
export class RateLimitCounter {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RateLimitCounterClient,
  ) {}

  /** Count one request against `key` and report the caller's standing in the current window. */
  async hit(key: string, windowMs: number): Promise<RateLimitHit> {
    return parseHit(
      await this.client.eval(HIT_SCRIPT, 1, key, String(windowMs)),
    );
  }
}
