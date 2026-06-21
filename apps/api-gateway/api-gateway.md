# api-gateway (module doc — DOC1)

## Purpose

The single public entry to the platform (MS4). Clients talk only to the gateway; it
validates auth once and fans out to internal services over RabbitMQ. **P1 scope is a
bootstrap only** — it exposes health and nothing else. Auth/JWT validation, RBAC route
guards, and RMQ request/reply + identity forwarding arrive in **P2**.

## Stack & build

- **NestJS 11**, ESM (`"type": "module"`, `module: nodenext`) — matches the repo's libs.
- Transpiled by **SWC** (`.swcrc`, `decoratorMetadata: true`) so Nest DI metadata is
  emitted (esbuild/tsx do **not** emit it). `tsc` is used for typecheck only.
- Targets (`project.json`): `build` (swc → `dist`), `serve` (swc `--watch` + `node
--watch`, the hot-reload dev loop). `typecheck`/`lint`/`test` are Nx-inferred.
- Nx tags: `scope:gateway`, `type:app` — may depend only on `scope:shared` libs.

## Endpoints

| Method | Path (behind nginx) | Returns                        | Notes                                          |
| ------ | ------------------- | ------------------------------ | ---------------------------------------------- |
| GET    | `/api/health`       | `ok({ status })` envelope (N9) | global prefix `api`; nginx routes `/api/` here |

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
