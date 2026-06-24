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
- `REDIS_CLIENT` — DI token for the raw client.

## Invalidation pattern (how consumers use it)

Pair a value key with a **version key**. On write, `incr` the version and read/write under `…:v{N}:…`; old versions expire by TTL. No cross-request delete races, no stale reads. Settings-service: `settings:branding:version` + `settings:branding:v{N}:global`.

## Notes

- `ioredis` is imported as a named `{ Redis }` (its recommended form; the compiled CJS exposes `exports.Redis` detectably for the Node ESM loader). Boot-verify per N12.
- Tags: `scope:shared` / `type:util`. `reflect-metadata` is an ignored dependency (the Nest decorators load it at runtime; not a source import).
