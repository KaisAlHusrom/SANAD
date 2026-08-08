# @sanad/util

**Purpose:** framework-agnostic shared utilities used across services and the gateway. Currently the typed env accessor and response-envelope builders. NestJS adapters (interceptor/filter/pipe/terminus) are added with the first running service (P1/P2), where they can be validated against a live app.

**Tags:** `scope:shared`, `type:util`. **Deps:** `zod`, `@sanad/contracts`, `@sanad/i18n`.

## Concepts (`src/lib/`)

| File          | Exports                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `env.ts`      | `appEnvSchema`, `AppEnv` (`development`/`staging`/`production`), `EnvError`, `readAppEnv()`, `loadEnv()` (fail-fast, U19), `isProduction/isStaging/isDevelopment`                            |
| `envelope.ts` | `ok(data, messageKey='common.ok')`, `fail(messageKey)` → `ResponseEnvelope` builders (F1/U3). The `message` field carries a **catalog key**, never prose — the interceptor renders it (U24). |

**Env:** branches on `APP_ENV` only, never `NODE_ENV` (U19/OPS1). The accessor requires its source be passed in (the app's single `env.ts` supplies `process.env`/`import.meta.env`).
**Events/settings:** none.
**Tests:** `env.spec.ts`, `envelope.spec.ts`.

## P2 additions — NestJS adapters (`src/lib/nest`, U20)

- **pipes/** — `ZodValidationPipe` (validate against a contracts schema, 400 on failure, N7).
- **interceptors/** — `ResponseEnvelopeInterceptor` (wrap responses in the 5-field N9 envelope).
- **filters/** — `AllExceptionsFilter` (standard error envelope + Postgres code mapping).
- Envelope: `toHttpEnvelope`/`failHttp` + the contract's `httpEnvelopeSchema`/`HttpResponseEnvelope`.

## Localization — this lib is the rendering EDGE (U24)

`@sanad/util` is where a backend message stops being a key and becomes text. Both places resolve
the caller's locale from the request headers (`resolveRequestLocale`: `x-sanad-locale` →
`accept-language` → `ar`) and call `translate()` from **`@sanad/i18n`**:

- **`ResponseEnvelopeInterceptor`** renders the envelope's `message` key (`common.ok` by default).
- **`AllExceptionsFilter`** reads `{ messageKey, params }` off the exception response and renders
  it; a plain-string `HttpException` still passes through unchanged (a safety net for anything
  not yet migrated), and an unknown error becomes the localized `common.internalError` — an
  internal invariant message NEVER reaches the client.
- **`POSTGRES_ERROR_MAP`** maps SQLSTATEs to `messageKey`s, not prose.
- **`ZodValidationPipe`** throws `{ messageKey: 'validation.failed', errors }`, mapping each Zod
  issue **code** to a `validation.*` key (a schema may supply its own key as an issue message).

Nothing in a controller or service formats a user-facing sentence; see `libs/shared/i18n/i18n.md`.

The error envelope carries an **optional `errors` leaf** (field path → localized message) that the
filter renders from the pipe's field→key map. It is omitted entirely when there is none, so a
normal error body keeps its exact five-field N9 shape. The admin portal surfaces it as
`ApiError.fields`.
