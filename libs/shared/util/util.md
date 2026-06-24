# @sanad/util

**Purpose:** framework-agnostic shared utilities used across services and the gateway. Currently the typed env accessor and response-envelope builders. NestJS adapters (interceptor/filter/pipe/terminus) are added with the first running service (P1/P2), where they can be validated against a live app.

**Tags:** `scope:shared`, `type:util`. **Deps:** `zod`, `@sanad/contracts`.

## Concepts (`src/lib/`)

| File          | Exports                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env.ts`      | `appEnvSchema`, `AppEnv` (`development`/`staging`/`production`), `EnvError`, `readAppEnv()`, `loadEnv()` (fail-fast, U19), `isProduction/isStaging/isDevelopment` |
| `envelope.ts` | `ok(data,message)`, `fail(message)` → `ResponseEnvelope` builders (F1/U3)                                                                                         |

**Env:** branches on `APP_ENV` only, never `NODE_ENV` (U19/OPS1). The accessor requires its source be passed in (the app's single `env.ts` supplies `process.env`/`import.meta.env`).
**Events/settings:** none.
**Tests:** `env.spec.ts`, `envelope.spec.ts`.

## P2 additions — NestJS adapters (`src/lib/nest`, U20)

- **pipes/** — `ZodValidationPipe` (validate against a contracts schema, 400 on failure, N7).
- **interceptors/** — `ResponseEnvelopeInterceptor` (wrap responses in the 5-field N9 envelope).
- **filters/** — `AllExceptionsFilter` (standard error envelope + Postgres code mapping).
- Envelope: `toHttpEnvelope`/`failHttp` + the contract's `httpEnvelopeSchema`/`HttpResponseEnvelope`.
