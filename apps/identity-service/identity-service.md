# identity-service

> The Sanad Tech identity & access service (P2). Owns users, roles, permissions, and
> refresh tokens; issues + verifies JWTs; answers the gateway over RabbitMQ.

## Purpose

Authentication (email/password → JWT access+refresh) and authorization (RBAC) for the
whole platform. It is the **only** owner of credentials and the RBAC graph. The API
gateway calls it over RMQ request/reply (MS2); it never faces the public internet (MS4).

## Toolchain

NestJS 11, ESM + SWC (N11), **hybrid app**: an HTTP server for the internal `/health`
endpoint + an RMQ microservice consuming `identity.commands`. Own database (MS5) via
Drizzle; migrations in `src/db/migrations` (generate → migrate, never push).

## Entities (own DB — `identity` / `identity_test`)

| Table             | Notes                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| `user`            | email (unique), `password` (argon2, **hidden** N2), name, is_active, soft-delete |
| `role`            | `key` matches the `Role` union in `@sanad/auth`                                  |
| `permission`      | `key` = `<resource>.<action>`                                                    |
| `role_permission` | role↔permission join                                                             |
| `user_role`       | user↔role join                                                                   |
| `refresh_token`   | `id` = jti, argon2 `token_hash`, expires_at, revoked_at (stateful + rotated)     |
| `outbox`          | transactional Outbox (MS3), shared table from `@sanad/messaging`                 |

## Decisions (P2)

1. **Permissions in the access token.** Login/refresh resolve the user's roles +
   deduped permission keys and bake them into the short-lived (15 min) RS256 access
   token, so the gateway authorizes at the edge with no extra round-trip. Admin holds
   the global `manage` wildcard → tiny token.
2. **RS256 asymmetric.** Identity holds the private key and signs; the gateway holds
   only the public key and verifies. Keys come from env as PEM (decision 2).
3. **Stateless access + stateful, rotated refresh.** Refresh tokens are persisted
   hashed; every refresh revokes the old row and issues a new one. An idempotent seed
   creates the role/permission catalog + one env admin so login works immediately.

## Contracts (`@sanad/contracts/identity`)

`loginRequestSchema`, `refreshRequestSchema`, `AuthResult`, `TokenPair`, `AuthUser`,
`LogoutResult`, `IDENTITY_PERMISSIONS`, and the message-pattern constants.

## Message patterns (MS2 — request/reply)

| Pattern                 | Payload                               | Reply                 |
| ----------------------- | ------------------------------------- | --------------------- |
| `identity.auth.login`   | `LoginRequest`                        | `AuthResult`          |
| `identity.auth.refresh` | `RefreshRequest`                      | `TokenPair`           |
| `identity.auth.logout`  | `RefreshRequest`                      | `LogoutResult`        |
| `identity.users.list`   | `ListQuery` (+ identity headers, MS4) | `Paginated<AuthUser>` |

Auth failures are raised as `RpcException({ statusCode, message })` so the gateway maps
them to the right HTTP status.

## Events emitted (MS3 — Outbox)

| Event             | When                                         | Consumers                     |
| ----------------- | -------------------------------------------- | ----------------------------- |
| `user.registered` | a user is created (currently the seed admin) | notifications (P6) — none yet |

## Settings used

None yet (settings-service is P3). Config comes from the typed env accessor (`env.ts`):
`DATABASE_URL`, `RABBITMQ_URL`, `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, `JWT_ACCESS_TTL_MIN`,
`JWT_REFRESH_TTL_DAYS`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Layout (DDD, N4)

- `db/schema` — Drizzle tables + the aggregate schema/handle.
- `identity/infrastructure` — repositories (queries live here, N1).
- `identity/application` — `AuthService`, `TokenService`, `PasswordHasher`, `UserReadService`.
- `identity/presentation` — thin `@MessagePattern` controllers (U5).
- `seed`, `outbox`, `health` — bootstrap seed, the Outbox relay lifecycle, readiness.

## Tests

Unit tests (no DB): `TokenService` (RS256 sign/verify) and `AuthService` (login/refresh
rotation/logout with fakes). End-to-end DB + RMQ is boot-verified via the dev stack
(login → refresh → `me`, and the RBAC reject) against `identity_test` (TDD2).
