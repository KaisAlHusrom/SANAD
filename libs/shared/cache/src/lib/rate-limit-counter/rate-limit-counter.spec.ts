import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RateLimitCounter,
  type RateLimitCounterClient,
} from './rate-limit-counter.js';

/**
 * An in-memory stand-in that INTERPRETS the script the counter sends, rather than faking its
 * result — otherwise the spec proves the wrapper and nothing about the atomicity it exists for.
 */
function fakeClient(): {
  client: RateLimitCounterClient;
  pexpires: string[];
  now: () => number;
  advance: (ms: number) => void;
} {
  const counts = new Map<string, number>();
  const expiries = new Map<string, number>();
  const pexpires: string[] = [];
  let clock = 1_000;

  const client: RateLimitCounterClient = {
    eval: (_script, numKeys, ...args) => {
      const key = String(args[0]);
      const windowMs = Number(args[numKeys]);
      // Mirror redis: an expired key is gone before the INCR lands.
      const expiresAt = expiries.get(key);
      if (expiresAt !== undefined && expiresAt <= clock) {
        counts.delete(key);
        expiries.delete(key);
      }
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      if (count === 1) {
        pexpires.push(key);
        expiries.set(key, clock + windowMs);
      }
      const ttl = (expiries.get(key) ?? clock) - clock;
      return Promise.resolve([count, ttl]);
    },
  };

  return {
    client,
    pexpires,
    now: () => clock,
    advance: (ms) => {
      clock += ms;
    },
  };
}

describe('RateLimitCounter', () => {
  let fake: ReturnType<typeof fakeClient>;
  let counter: RateLimitCounter;

  beforeEach(() => {
    fake = fakeClient();
    counter = new RateLimitCounter(fake.client);
  });

  it('counts the first hit and arms the window', async () => {
    expect(await counter.hit('rl:v1:lead:1.2.3.4', 60_000)).toEqual({
      count: 1,
      resetInMs: 60_000,
    });
  });

  // The window is anchored at the FIRST hit. Re-arming on every hit would let a steady caller
  // hold a key alive forever and never reset their budget.
  it('does not re-arm the expiry on later hits in the same window', async () => {
    await counter.hit('k', 60_000);
    await counter.hit('k', 60_000);
    const third = await counter.hit('k', 60_000);
    expect(third.count).toBe(3);
    expect(fake.pexpires).toEqual(['k']);
  });

  it('keeps separate keys on separate budgets', async () => {
    await counter.hit('rl:v1:auth:1.1.1.1', 60_000);
    await counter.hit('rl:v1:auth:1.1.1.1', 60_000);
    expect((await counter.hit('rl:v1:lead:1.1.1.1', 60_000)).count).toBe(1);
  });

  it('reports the real remaining time so Retry-After is honest', async () => {
    await counter.hit('k', 60_000);
    fake.advance(20_000);
    expect((await counter.hit('k', 60_000)).resetInMs).toBe(40_000);
  });

  it('starts a fresh window once the old one has expired', async () => {
    await counter.hit('k', 1_000);
    fake.advance(1_500);
    expect(await counter.hit('k', 1_000)).toEqual({
      count: 1,
      resetInMs: 1_000,
    });
  });

  it('sends exactly one key and the window in milliseconds', async () => {
    const evalSpy = vi.fn().mockResolvedValue([1, 60_000]);
    await new RateLimitCounter({ eval: evalSpy }).hit('k', 60_000);
    const [script, numKeys, key, windowMs] = evalSpy.mock.calls[0] ?? [];
    expect(typeof script).toBe('string');
    expect(numKeys).toBe(1);
    expect(key).toBe('k');
    expect(windowMs).toBe('60000');
  });

  // The GUARD decides to fail open; the storage must report what actually happened. A counter
  // that swallowed a Redis error would look like a permanently empty bucket — silently no limit.
  it('propagates a client failure instead of pretending the hit landed', async () => {
    const rejecting: RateLimitCounterClient = {
      eval: () => Promise.reject(new Error('READONLY')),
    };
    await expect(
      new RateLimitCounter(rejecting).hit('k', 60_000),
    ).rejects.toThrow('READONLY');
  });

  it('rejects a reply it cannot trust rather than inventing a count', async () => {
    const garbage: RateLimitCounterClient = {
      eval: () => Promise.resolve('OK'),
    };
    await expect(
      new RateLimitCounter(garbage).hit('k', 60_000),
    ).rejects.toThrow(/unexpected/i);
  });
});
