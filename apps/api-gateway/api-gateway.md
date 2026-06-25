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

P6 additions (integration-secrets vault + in-app notifications):

| Method | Path                            | Auth                                      | Returns                   | Notes                                                                                                                                              |
| ------ | ------------------------------- | ----------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/integration-secrets`      | JWT + `settings.secrets.read`             | `SecretStatus[]`          | masked vault status; → `settings.integration-secret.status`; never a value (N13)                                                                   |
| PUT    | `/api/integration-secrets/:key` | JWT + `settings.secrets.<feature>.manage` | `SecretStatus`            | set/rotate an encrypted secret; gated **per third party** by `SecretPermissionGuard` (P7.B — e.g. `SMTP_PASSWORD`→`settings.secrets.email.manage`) |
| GET    | `/api/notifications`            | JWT + `notification.read`                 | `Paginated<Notification>` | caller's in-app notices (roles ∪ id); `?unread=true`                                                                                               |
| PATCH  | `/api/notifications/:id/read`   | JWT + `notification.read`                 | `Notification`            | mark one read (if owned)                                                                                                                           |

(Media (P4) + content (P5) routes are mapped in the Postman collection — the complete
endpoint map, DOC2.)

## Auth internals

- `CoreModule` (global) registers the `IDENTITY_CLIENT` (`identity.commands`) **and the
  `SETTINGS_CLIENT` (`settings.commands`, P3)** RMQ ClientProxies, and provides the RS256
  `TokenVerifier` (public key from env).
- Guards from `@sanad/auth`: `JwtAuthGuard` (verify + attach `IdentityContext`) then
  `PermissionsGuard` (`@RequirePermissions(...)`). `toHttpException` maps RMQ
  `RpcException({ statusCode })` back to HTTP statuses.

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
  `0.0.0.0`). Validated once at startup, fails fast (OPS1).

## Internal seams

- `health/health.reporter.ts` — abstract `HealthReporter` (DI token + type); the
  controller depends on it (thin controller, U5). Bound to `TerminusHealthReporter`
  (`@nestjs/terminus`, heap liveness indicator) in `health.module.ts`.

## Run

- In the dev stack: `docker compose -f infra/docker-compose.dev.yml up -d --build`,
  then `curl http://localhost:8190/api/health`.
- Standalone: `pnpm exec nx serve api-gateway` (needs Postgres/Redis/RabbitMQ only from P2).
