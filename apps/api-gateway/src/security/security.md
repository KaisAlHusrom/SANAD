# Gateway security — edge hardening (P8.10.A)

> The protection that has to exist before a public URL does. `POST /api/leads` and
> `POST /api/auth/login` are the two most-attacked surfaces in the product the day ads start.

## What it provides

| Concern                                                       | Where                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Per-route rate limiting, Redis-backed, fed live from settings | `guards/rate-limit/`, `resolvers/rate-limit-policies/`                                         |
| Route policy declaration                                      | `decorators/rate-limit.decorator.ts` — `@RateLimit('auth' \| 'lead' \| 'default' \| 'none')`   |
| Response security headers                                     | `helpers/helmet-options/`                                                                      |
| Cross-origin policy                                           | `helpers/cors-options/`                                                                        |
| Tunables                                                      | `rate-limit.constants.ts`; the numbers themselves live in `@sanad/contracts/security-settings` |

`main.ts` owns the rest of the edge: `trust proxy`, body-size limits, `x-powered-by` off.

## Settings used (U9)

Group `security`, section `rateLimit`, all `global` scope / `optional` requirement — every key has
a coded default, so nothing is ever unset.

| Key                                                   | Type    | Coded default |
| ----------------------------------------------------- | ------- | ------------- |
| `security.rateLimit.enabled`                          | boolean | `true`        |
| `security.rateLimit.auth.limit` / `.windowSeconds`    | number  | `10` / `300`  |
| `security.rateLimit.lead.limit` / `.windowSeconds`    | number  | `20` / `3600` |
| `security.rateLimit.default.limit` / `.windowSeconds` | number  | `300` / `60`  |

The defaults live in `libs/contracts/src/lib/settings/security-settings.ts`, not here and not in
settings-service: the gateway needs them as its fail-open floor and settings-service needs them as
the U9 coded default. Two copies would drift, and the copy that drifts is the one nobody sees.

`lead` is deliberately generous — Gulf mobile carriers use CGNAT heavily, so real visitors share
addresses. It is a starting number, not a finding; tune it from **Settings → Security** and the
gateway picks it up within the TTL, no redeploy.

## Message keys (U24)

`security.rateLimited` — parameterised with `{seconds}`, rendered into the caller's locale by the
gateway's existing exception filter. Never prose.

## The five decisions worth not re-deriving

**1. A bespoke guard, not `@nestjs/throttler`.** `ThrottlerModule.forRoot(Async)` resolves its
limits **once at bootstrap**, which is incompatible with settings-fed limits, and a throwing
`ThrottlerStorage.increment` becomes a 500 — there is no fail-open model. Once you override the
tracker, the storage, the exception _and_ the option resolution, nothing of the package is left
but its decorator names. ~130 lines, and zero extra CJS on the ESM boot path (N12).

**2. It fails open on all four paths, and that is the point.** Redis rejects → allow + warn.
Redis hangs → allow after `RATE_LIMIT_REDIS_TIMEOUT_MS`. Settings unreachable → last-good
snapshot (cold start: coded defaults). Address unknown → allow. A rate limiter that can refuse
legitimate traffic because of its own dependencies has become the outage it was meant to prevent.

The hang case is not theoretical: `CacheModule` builds its client with
`maxRetriesPerRequest: null`, which **queues commands forever** across reconnects. Right for a
cache, catastrophic for a per-request guard. The `Promise.race` deadline is load-bearing — its
spec fails by _timing out_ if the race is removed, which is exactly the production symptom.

**3. Keying on `req.ip`, never the first `X-Forwarded-For` hop.** nginx **appends**
(`$proxy_add_x_forwarded_for`), so a caller sending `X-Forwarded-For: 1.2.3.4` produces
`1.2.3.4, <real ip>` — the leftmost entry is attacker-controlled. Keying on it would hand an
attacker a fresh bucket per request. Under `trust proxy` Express resolves `req.ip` to the
rightmost entry the chain did not add, which is the value that cannot be forged. **This makes
`TRUST_PROXY_HOPS` a security parameter**: too low and every caller shares nginx's bucket (a
self-inflicted DoS), too high and the spoof is back.

The address comes from the ALS scope `requestContextMiddleware` opens — the same value the audit
row records — so a 429 and its trail can never disagree about who was calling (U3).

**4. A fixed window anchored at the first hit, one `EVAL`.** See `@sanad/cache`'s `cache.md` for
why the script is atomic rather than `INCR` + `PEXPIRE`. Accepted trade-off: a caller can burst
up to **2× the limit** across a window boundary. For `auth` at 10/5 min that is 20 attempts in
five minutes — far under any credential-stuffing threshold, and a sliding-window log costs four
commands plus unbounded per-key memory for precision nothing here needs.

**5. The policy snapshot is synchronous stale-while-revalidate.** `SmtpEmailProvider` _awaits_
its refresh, which is right for a send path. This runs on **every request**, so awaiting would
make one request a minute pay an RMQ round trip (up to the 5 s send timeout) for a value that
changes almost never. `current()` returns the last-good snapshot and schedules the refresh.

## Ordering that makes it work

- `app.set('trust proxy', …)` runs **before** anything reads `req.ip`.
- `helmet` mounts **before the router**, so its headers land on 404s and errors too.
- `useBodyParser` runs **before `listen()`** — Nest registers its own 100 kb parsers inside
  `init()` and skips a parser already on the router stack, so this replaces rather than stacks.
- `app.use(requestContextMiddleware)` runs **before Express routing**, so the global `APP_GUARD`
  is always inside the ALS scope it reads the ip from.
- Nest runs global guards **before** route-level `@UseGuards`, so a flood is rejected before JWT
  verification — the cheap path. That also means no identity is attached yet, which is _why_
  buckets are keyed on address alone.

## Scope note on the CSP

helmet mounts on the **gateway**, which never serves HTML. nginx routes `/` to Next.js and
`/admin/` to Vite, and neither response passes through here — so this CSP is never the CSP a
browser applies to a website or admin _document_. All content directives are `'none'`: a backstop
for a browser that somehow renders a JSON body, not a policy any real page lives within. The only
helmet header that can reach those apps is `Cross-Origin-Resource-Policy`, which tracks the CORS
allow-list.

## Risk carried forward

`APP_GUARD` is the platform's **first global guard** — it now runs ahead of every route. The
`@RateLimit('none')` escape hatch plus the four fail-open paths bound the blast radius, but this
is the single riskiest line in the phase.
