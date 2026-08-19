# @sanad/cache

> Shared Redis cache primitive — cross-cutting **chassis infrastructure** (caching), not domain logic (U2/U17). Added in P3.

## Purpose

One place to wire a Redis connection and store/read **typed JSON** values the same way across every service. Built because the settings-service needs a resolved-branding cache now, and the content-service (P5) will cache translations next — two concrete consumers, so it's shared rather than duplicated (the "more than one service" governance test for a shared lib).

Kept deliberately thin: a connection + `get`/`set`/`del`/`incr`. No business logic lives here.

## Exports

- `CacheModule.forRoot({ url })` — `@Global` dynamic module. Provides one `ioredis` client (`REDIS_CLIENT`) + the `RedisCache` service; quits the connection on shutdown (MS8). Mirrors `DrizzleModule.forRoot`.
- `RedisCache` — injectable primitive:
  - `get<T>(key)` → parsed value or `null`
  - `set(key, value, ttlSeconds?)` → JSON-serialize; positive TTL uses `SETEX`
  - `del(key)`
  - `incr(key)` → atomic increment (for **version-key invalidation**)
- `RedisClient` — the minimal Redis surface `RedisCache` depends on (an ioredis client satisfies it structurally; tests fake it, so unit tests need no live Redis).
- `RateLimitCounter` (P8.10.A) — injectable counting primitive, **separate from `RedisCache`** (U10: one is a JSON store, the other counts; they share no command but `incr`):
  - `hit(key, windowMs)` → `{ count, resetInMs }` — a fixed window **anchored at the first hit**, in one `EVAL`.
  - `RateLimitCounterClient` — its own minimal surface (`eval` only), so it fakes independently.
- `REDIS_CLIENT` — DI token for the raw client.

## Why `RateLimitCounter` is a script, not two commands

`INCR` then `PEXPIRE` as separate calls leaks a TTL-less key if the process dies between them — and that key blocks its caller **forever**. Inside the script the pair is atomic. `PEXPIRE` runs only when `count == 1`, which is what anchors the window: re-arming on every hit would let a steady caller hold the key alive and never reset their budget. The script returns `PTTL` so a rejection can carry an honest `Retry-After`.

Accepted trade-off over a sliding-window log: a caller can burst up to **2× the limit** across a window boundary. A log costs four commands and unbounded per-key memory for precision no limit here needs.

**A caller that fails must fail loudly.** `hit` propagates a Redis error rather than returning a zero — a counter that swallowed one would look like a permanently empty bucket, i.e. silently no limit at all. Deciding to _fail open_ is the guard's job, not the storage's.

## Invalidation pattern (how consumers use it)

Pair a value key with a **version key**. On write, `incr` the version and read/write under `…:v{N}:…`; old versions expire by TTL. No cross-request delete races, no stale reads. Settings-service: `settings:branding:version` + `settings:branding:v{N}:global`.

## Notes

- **The client carries an `error` listener.** ioredis emits `error` on _every_ reconnect attempt; with no listener Node prints `[ioredis] Unhandled error event` per attempt (a real 2-second outage produced 7 lines per process, in two processes). The listener turns that into one structured warn and keeps the process alive — which is what every caller's own fallback already assumes.
- **`maxRetriesPerRequest: null` queues commands forever across reconnects.** Right for a cache that tolerates a blip; **wrong for anything on a per-request path**, which is why `RateLimitGuard` (P8.10.A) races each `hit()` against its own 100 ms deadline rather than trusting the client to fail.
- `ioredis` is imported as a named `{ Redis }` (its recommended form; the compiled CJS exposes `exports.Redis` detectably for the Node ESM loader). Boot-verify per N12.
- Tags: `scope:shared` / `type:util`. `reflect-metadata` is an ignored dependency (the Nest decorators load it at runtime; not a source import).
