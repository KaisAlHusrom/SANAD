# @sanad/auth

**Purpose:** the shared identity/RBAC primitives. Role set (one Identity service, scoped roles), the forwarded identity context, the JWT payload schema, and pure RBAC policy helpers. The NestJS JWT guard + RBAC decorators are thin wrappers added with the gateway/Identity service (P2), which validates the JWT once and forwards identity in RMQ headers.

**Tags:** `scope:shared`, `type:util`. **Deps:** `zod`.

## Concepts (`src/lib/`)

| File                  | Exports                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| `role.ts`             | `STAFF_ROLES`, `CLIENT_ROLE`, `roleSchema`, `Role`, `ALL_ROLES`, `isStaffRole()` |
| `identity-context.ts` | `identityContextSchema` (`.strict()`), `IdentityContext` (forwarded to services) |
| `jwt-payload.ts`      | `tokenTypeSchema`, `TokenType`, `jwtPayloadSchema` (`.strict()`), `JwtPayload`   |
| `rbac.ts`             | `hasRole()`, `hasAnyRole()`, `hasAllRoles()`, `isStaff()`                        |

**Events/settings:** none.
**Tests:** `rbac.spec.ts` (membership, staff/client, schema rejection).

## P2 additions — NestJS adapters (`src/lib/nest`, grouped by kind, U20)

- **verifiers/** — `TokenVerifier` seam + `JwtTokenVerifier` (RS256, public-key verify).
- **guards/** — `JwtAuthGuard` (verify bearer → attach `IdentityContext`), `PermissionsGuard` (`@RequirePermissions`, honors the `manage` wildcards).
- **decorators/** — `@RequirePermissions(...)`, `@CurrentUser()`.
- **helpers/** — `identityToHeaders`/`identityFromHeaders` (forward identity in RMQ headers, MS4).
- Policy: `hasPermission`/`identityHasPermission` + `GLOBAL_MANAGE_PERMISSION`; `accessTokenPayloadSchema`/`refreshTokenPayloadSchema` carry permissions.
