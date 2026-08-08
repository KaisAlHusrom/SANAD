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

## Errors — keys, never prose (U24)

Both factories return `rpcError(status, key, params?)` from
[`@sanad/i18n`](../../libs/shared/i18n/i18n.md); the sentence lives only in the ar/en catalogs
and is rendered once at the gateway edge (`toHttpException` → `AllExceptionsFilter`).

| File                                                        | Factory                 | Status | Key                        |
| ----------------------------------------------------------- | ----------------------- | ------ | -------------------------- |
| [`auth-errors.ts`](src/identity/application/auth-errors.ts) | `invalidCredentials()`  | 401    | `auth.invalidCredentials`  |
|                                                             | `invalidRefreshToken()` | 401    | `auth.invalidRefreshToken` |
| [`user-errors.ts`](src/identity/application/user-errors.ts) | `userNotFound(id)`      | 404    | `identity.userNotFound`    |
|                                                             | `emailConflict(email)`  | 409    | `identity.emailConflict`   |
|                                                             | `roleNotFound(key)`     | 404    | `identity.roleNotFound`    |

Auth errors stay deliberately vague (never reveal whether the email or the password was wrong)
and take no params; the admin-facing user errors name the offending value via `params`.

## Contracts (`@sanad/contracts/identity`)

`loginRequestSchema`, `refreshRequestSchema`, `AuthResult`, `TokenPair`, `AuthUser`,
`LogoutResult`, `IDENTITY_PERMISSIONS`, and the message-pattern constants.

## Message patterns (MS2 — request/reply)

| Pattern                      | Payload                               | Reply                 |
| ---------------------------- | ------------------------------------- | --------------------- |
| `identity.auth.login`        | `LoginRequest`                        | `AuthResult`          |
| `identity.auth.refresh`      | `RefreshRequest`                      | `TokenPair`           |
| `identity.auth.logout`       | `RefreshRequest`                      | `LogoutResult`        |
| `identity.users.list`        | `ListQuery` (+ identity headers, MS4) | `Paginated<AuthUser>` |
| `identity.users.create`      | `UserCreateRequest`                   | `AuthUser`            |
| `identity.users.update`      | `UserUpdateRequest`                   | `AuthUser`            |
| `identity.users.role-assign` | `UserRoleAssignRequest`               | `AuthUser`            |
| `identity.users.role-revoke` | `UserRoleAssignRequest`               | `AuthUser`            |
| `identity.roles.list`        | — (+ identity headers, MS4)           | `RoleSummary[]`       |

Auth failures are raised as `RpcException({ statusCode, message })` so the gateway maps
them to the right HTTP status. P7.D adds `UserWriteService` (admin user CRUD + role
assign/revoke) — **N14-compliant**: it depends on repositories + the injected
`TransactionRunner` (the create hashes the password and inserts the user + its role
assignments in ONE transaction), never the `DRIZZLE` handle. `user-errors.ts` raises
404/409 (`userNotFound`/`emailConflict`/`roleNotFound`). The role write/list reuses the
existing `RbacRepository` (new `revokeRoleFromUser` + `listRoles`).

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
- `identity/application` — `AuthService`, `TokenService`, `PasswordHasher`, `UserReadService`,
  `UserWriteService` (N14 — create/update + role assign/revoke), `user-errors`.
- `identity/presentation` — thin `@MessagePattern` controllers (U5): `auth`, `users`, `roles`.
- `seed`, `outbox`, `health` — bootstrap seed, the Outbox relay lifecycle, readiness.

## Tests

Unit tests (no DB): `TokenService` (RS256 sign/verify), `AuthService` (login/refresh
rotation/logout with fakes), and `UserWriteService` (create hashes + assigns atomically,
409 on dupe, 404 on missing, update/assign/revoke — with faked repos/hasher/tx).
**`identity-db.int.spec.ts`** (P7.D, the first identity DB test) exercises the real CRUD on
`identity_test` (TDD2): create→assign→list reflects roles, deactivate, revoke, unique-email 409. End-to-end DB + RMQ is also boot-verified via the dev stack (login → refresh → `me`,
the RBAC reject, and the user-management writes).
