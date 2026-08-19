# api-gateway (module doc — DOC1)

## Purpose

The single public entry to the platform (MS4). Clients talk only to the gateway; it
validates auth once and fans out to internal services over RabbitMQ. **P2** added auth:
the gateway verifies the RS256 access token at the edge, enforces RBAC permissions, and
forwards the validated identity to services in RMQ headers (never the raw token).

## Stack & build

- **NestJS 11**, ESM (`"type": "module"`, `module: nodenext`) — matches the repo's libs.
- Transpiled by **SWC** (`.swcrc`, `decoratorMetadata: true`) so Nest DI metadata is
  emitted (esbuild/tsx do **not** emit it). `tsc` is used for typecheck only.
- Targets (`project.json`): `build` (swc → `dist`), `serve` (swc `--watch` + `node
--watch`, the hot-reload dev loop). `typecheck`/`lint`/`test` are Nx-inferred.
- Nx tags: `scope:gateway`, `type:app` — may depend only on `scope:shared` libs.

## Endpoints

All responses are the 5-field wire envelope (N9), added by the global
`ResponseEnvelopeInterceptor`; errors by the global `AllExceptionsFilter`.

| Method | Path (behind nginx)   | Auth                        | Returns               | Notes                                                                                                           |
| ------ | --------------------- | --------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`         | —                           | `{ status }`          | liveness                                                                                                        |
| POST   | `/api/auth/login`     | —                           | `AuthResult`          | → `identity.auth.login` (MS2)                                                                                   |
| POST   | `/api/auth/refresh`   | —                           | `TokenPair`           | rotates the refresh token                                                                                       |
| POST   | `/api/auth/logout`    | —                           | `LogoutResult`        | revokes the refresh token                                                                                       |
| GET    | `/api/auth/me`        | JWT                         | `IdentityContext`     | sample protected route                                                                                          |
| GET    | `/api/identity/users` | JWT + `identity.users.read` | `Paginated<AuthUser>` | **RBAC sample**: 403 without the permission; forwards identity headers to `identity.users.list` (MS4)           |
| GET    | `/api/branding`       | — (public)                  | `BrandingRecord`      | **P3**: website reads branding unauthenticated; → `settings.branding.get` (MS2); coded defaults when unset (F7) |
| PUT    | `/api/branding`       | JWT + `settings.manage`     | `BrandingRecord`      | **P3**: deep-partial update; forwards identity headers to `settings.branding.update` (MS4)                      |

P6 additions (integrations + in-app notifications). **Integrations** are grouped
capability → providers → active (N13, reworked 2026-07-19); masked reads need
`settings.integrations.read`, writes need `settings.integrations.<capability>.manage`
(`IntegrationPermissionGuard`), and **test** is routed to the service that owns the adapter (MS1):

| Method | Path                                           | Guard                              | Returns                         | Notes                                                               |
| ------ | ---------------------------------------------- | ---------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/integrations`                            | JWT + `settings.integrations.read` | `IntegrationCapabilityStatus[]` | masked; secrets only as `last4`; → `settings.integration.status`    |
| PUT    | `/api/integrations/:capability/:provider`      | JWT + capability manage            | refreshed status                | configure a provider; absent field = untouched, `''` = clear        |
| PUT    | `/api/integrations/:capability/active`         | JWT + capability manage            | refreshed status                | choose the active provider                                          |
| POST   | `/api/integrations/:capability/:provider/test` | JWT + capability manage            | `IntegrationTestResult`         | real round-trip via media (`HeadBucket`) / notifications (`verify`) |

| Method | Path                          | Auth                      | Returns                   | Notes                                                |
| ------ | ----------------------------- | ------------------------- | ------------------------- | ---------------------------------------------------- |
| GET    | `/api/notifications`          | JWT + `notification.read` | `Paginated<Notification>` | caller's in-app notices (roles ∪ id); `?unread=true` |
| PATCH  | `/api/notifications/:id/read` | JWT + `notification.read` | `Notification`            | mark one read (if owned)                             |

P7.D additions (users/roles management + dashboard aggregation):

| Method | Path                                  | Auth                          | Returns          | Notes                                                                                                             |
| ------ | ------------------------------------- | ----------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/identity/users`                 | JWT + `identity.users.manage` | `AuthUser`       | create a user (password hashed + roles assigned in one tx); → `identity.users.create`; 409 on dupe                |
| PATCH  | `/api/identity/users/:id`             | JWT + `identity.users.manage` | `AuthUser`       | profile update (name/email/isActive); → `identity.users.update`; 404/409                                          |
| POST   | `/api/identity/users/:id/roles`       | JWT + `identity.users.manage` | `AuthUser`       | assign a role; → `identity.users.role-assign`                                                                     |
| DELETE | `/api/identity/users/:id/roles/:role` | JWT + `identity.users.manage` | `AuthUser`       | revoke a role (`:role` validated vs the `Role` enum); → `identity.users.role-revoke`                              |
| GET    | `/api/identity/roles`                 | JWT + `identity.roles.read`   | `RoleSummary[]`  | the bounded role catalog; → `identity.roles.list`                                                                 |
| GET    | `/api/dashboard/stats`                | JWT + `content.read`          | `DashboardStats` | API composition: fans out list patterns across content/identity/notifications; each leg degrades to 0 (never 500) |

(Media (P4) + content (P5) routes are mapped in the Postman collection — the complete
endpoint map, DOC2.)

Content ordering + admin fetch: every orderable content resource exposes
`PATCH /api/content/<resource>/reorder` (JWT + `content.manage`; body `{ ids }`; an atomic
`sortOrder` renumber for drag-and-drop — services, testimonials, team, faqs, portfolio,
portfolio-categories, blog-categories, blog-tags). Blog also adds
`GET /api/content/blog/manage/:id` (JWT + `content.read`, drafts visible) — the by-id fetch
feeding the admin post editor.

## Auth internals

- `CoreModule` (global) registers the `IDENTITY_CLIENT` (`identity.commands`) **and the
  `SETTINGS_CLIENT` (`settings.commands`, P3)** RMQ ClientProxies, and provides the RS256
  `TokenVerifier` (public key from env).
- Guards from `@sanad/auth`: `JwtAuthGuard` (verify + attach `IdentityContext`) then
  `PermissionsGuard` (`@RequirePermissions(...)`). `toHttpException` maps RMQ
  `RpcException({ statusCode })` back to HTTP statuses.

## Localization — the gateway is the renderer (U24)

Services never emit prose; they emit a **message key**. The gateway resolves the caller's
locale, forwards it inward, and renders the text once at the edge (U8 — Arabic is the
default, and it is sent explicitly, never implied). The catalogs and helpers live in
[`libs/shared/i18n`](../../libs/shared/i18n/i18n.md); the interceptor/filter that actually
translate live in [`@sanad/util`](../../libs/shared/util/util.md).

- **Resolve** — [`@RequestLocale()`](src/core/decorators/request-locale.decorator.ts) injects
  the caller's `Locale` into a handler (`x-sanad-locale` → `accept-language` → `ar`).
- **Forward** — [`forwardHeaders(identity, locale)`](src/core/helpers/forward-headers/forward-headers.ts)
  is the one place the RMQ headers are built: the validated identity (MS4), the locale so a service
  can localize text that lives inside its payload, **and (P8.8) the caller's circumstances** — ip,
  user-agent, request id. It replaced `identityToHeaders(identity)` at every `sendRequest` call
  site; a public route passes `null` for the identity and forwards locale + context alone.

## Request context (P8.8) — how ip / user-agent / request id reach a service

[`requestContextMiddleware`](src/core/middlewares/request-context/request-context.middleware.ts) is
registered **first** in `main.ts` via `app.use(...)`. It runs the whole request inside an
`AsyncLocalStorage` scope carrying `{ ip, userAgent, requestId }`, which `forwardHeaders` reads and
serialises into `x-sanad-request-context`. Three decisions behind that shape:

- **Express middleware, not a Nest interceptor.** An interceptor's `next.handle()` is _subscribed_
  after `intercept()` returns, so the controller would execute outside any scope opened around it.
  `app.use` wraps the entire downstream chain — guards, controller, and the RMQ send.
- **Read from the scope, not from a parameter.** `forwardHeaders` has ~26 call sites; a third
  argument would mean every future audited route had to remember to thread it. This way every
  gateway→service call already carries the context and no later phase revisits a route.
- **`req.ip` is the client — NOT the first `x-forwarded-for` hop** (corrected in P8.10.A). The
  original reading had it backwards: nginx **appends** (`$proxy_add_x_forwarded_for`), so a caller
  sending `X-Forwarded-For: 1.2.3.4` produces `1.2.3.4, <real ip>` and the leftmost entry is
  attacker-controlled. With `app.set('trust proxy', TRUST_PROXY_HOPS)` Express resolves `req.ip` to
  the rightmost entry the chain did not add — the value that cannot be forged, and the one the rate
  limiter keys on. The forwarded chain survives only as a fallback for a request Express never
  touched. The derivation itself is `requestContextFromHttp` in `@sanad/util`, shared with the audit
  interceptor's HTTP branch so the two can never disagree (U3).

`requestId` honours an inbound `x-request-id` (sanitised: ≤128 chars, `[A-Za-z0-9._:-]`, because it
reaches DB rows and log lines) and is **generated when absent** (P8.10.A). It is stamped back onto
`request.headers` — which is how the audit interceptor's HTTP branch, which reads the request rather
than the scope, sees it — and echoed on the response as `X-Request-Id`. In the dev stack nginx mints
it, so an access-log line and an audit row share one id.

- **Map back** — [`toHttpException`](src/core/rpc-error.ts) carries an RMQ failure's
  `{ statusCode, messageKey, params }` through verbatim for the filter to render. An upstream
  that only sends a bare `message` string is treated as **un-keyed**: the prose is dropped
  (it would reach the user untranslated) and replaced by `common.requestFailed`, keeping only
  the status. Anything else → the localized `common.upstreamError` 500.
- **Guards/controllers throw keys too** — `httpError(status, key, params?)`, e.g.
  `IntegrationPermissionGuard` (`auth.noIdentity` / `auth.forbidden`) and the media
  controller's `media.invalidIds`.

## Entities

None (gateway owns no database — MS4/MS5).

## Contracts

- `ResponseEnvelope<T>` + `envelopeSchema` from `@sanad/contracts` (the 3-field
  `{ success, message, data }` shape; the `ok()` builder lives in `@sanad/util`).

## Events emitted / consumed

None in P1.

## Settings / config used

- `src/env.ts` is the app's single typed env accessor (U19) — the only reader of
  `process.env`. Schema: `APP_ENV` (required), `PORT` (default 3000), `HOST` (default
  `0.0.0.0`), `RABBITMQ_URL`, `JWT_PUBLIC_KEY`, plus the P8.10.A edge keys:
  - `REDIS_URL` (required) — backs the rate-limit counter. Injected into the container since P3;
    the schema simply ignored it until now.
  - `CORS_ALLOWED_ORIGINS` — comma-separated, trimmed + de-duplicated. **Empty outside
    development**: the admin calls a relative `/api` (same origin, Bearer not cookies) and the
    website fetches server-side, so nothing needs CORS today.
  - `TRUST_PROXY_HOPS` (default `1`) — a **security parameter**, see `src/security/security.md`.

  `APP_ENV` is read first because it decides the CORS default; a `z.preprocess` cannot see a
  sibling key. Validated once at startup, fails fast (OPS1).

## Edge hardening (P8.10.A)

Rate limiting, helmet, CORS, body limits and `trust proxy` — all documented in
[`src/security/security.md`](src/security/security.md). Two things worth knowing from here:

- **Every route now passes a global `APP_GUARD`** (`RateLimitGuard`), the platform's first. Routes
  opt out with `@RateLimit('none')` (health) or into a tighter bucket with `@RateLimit('auth')`
  (the whole `AuthController`) / `@RateLimit('lead')` (the public `POST /leads` only — the guarded
  inbox routes stay on `default`, so an admin paging leads never spends the anti-spam budget).
- **Every response carries `X-Request-Id`** and, on a counted route, `X-RateLimit-Limit` /
  `-Remaining` / `-Reset`; a rejected one carries `Retry-After` and a localized 429
  (`security.rateLimited`).

## Internal seams

- `health/health.reporter.ts` — abstract `HealthReporter` (DI token + type); the
  controller depends on it (thin controller, U5). Bound to `TerminusHealthReporter`
  (`@nestjs/terminus`, heap liveness indicator) in `health.module.ts`.

## Settings (descriptor-driven, 2026-06-27)

`settings/settings.controller.ts` — the admin settings surface (separate from the public
`branding` surface): `GET /api/settings` (guard `settings.read`) → `SETTINGS_CATALOG_GET`
returns the full `SettingsCatalog` (groups → sections → fields with descriptor + resolved
value); `PUT /api/settings` (guard `settings.manage`) → `SETTINGS_SET` applies a batch of
typed `{ key, value }` writes and returns the refreshed catalog (identity forwarded in RMQ
headers, MS4). Uses the existing `SETTINGS_CLIENT`. `GET /api/branding` stays public/unchanged.

## Run

- In the dev stack: `docker compose -f infra/docker-compose.dev.yml up -d --build`,
  then `curl http://localhost:8190/api/health`.
- Standalone: `pnpm exec nx serve api-gateway` (needs Postgres/Redis/RabbitMQ only from P2).
