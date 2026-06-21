# 01 — Architecture

> The concrete architecture for the chosen stack: Nx monorepo, NestJS microservices, shared libs, contracts, data layer, frontends, theming/i18n, auth. Pairs with `03-microservices-platform.md` (the broker/Outbox/saga deep dive) and `05-deployment.md` (Docker/nginx/env).

## Monorepo layout (Nx + pnpm)

```
sanad/
├─ apps/
│  ├─ api-gateway/            # HTTP edge — the only public entry
│  ├─ identity-service/       # auth, users, RBAC          (own DB: identity)
│  ├─ settings-service/       # advanced config + branding (own DB: settings)
│  ├─ content-service/        # website CMS + leads        (own DB: content)
│  ├─ media-service/          # Cloudflare R2              (own DB: media)
│  ├─ notifications-service/  # email + in-app             (own DB: notifications)
│  ├─ website/                # Next.js App Router (public)
│  ├─ admin-portal/           # React + Vite (staff/ERP)
│  └─ client-portal/          # React + Vite (clients)
├─ libs/
│  ├─ contracts/              # Zod schemas + types: SINGLE SOURCE OF TRUTH
│  ├─ shared/
│  │  ├─ database/            # base + translatable repositories, model-config, drizzle helpers, DateTime
│  │  ├─ messaging/           # RMQ transport, event contracts, request/reply, Outbox, idempotent-consumer
│  │  ├─ auth/                # JWT guards, identity context, RBAC decorators
│  │  ├─ util/                # env accessor, envelope interceptor, exception filter, health, shutdown, logging, OTel
│  │  └─ config/              # tsconfig/eslint/prettier/tailwind presets
│  └─ web/
│     ├─ ui/                  # shadcn primitives + design tokens (portals)
│     ├─ data/               # RTK Query registry, baseQueryWithAuth, envelope-unwrap, client event bus
│     └─ i18n/               # ar/en catalogs, RTL helpers, format helpers
├─ infra/                     # docker/, nginx/, scripts/, env templates (see 05-deployment.md)
├─ nx.json  pnpm-workspace.yaml  tsconfig.base.json  package.json
```

### Nx tags & boundaries (MS1, MS9)
Every project is tagged on two axes; `@nx/enforce-module-boundaries` enforces them in lint/CI:
- `type:` — `app` | `feature` | `data-access` | `util` | `types`
- `scope:` — `shared` | `identity` | `settings` | `content` | `media` | `notifications` | `web` | …

Rules: `type:app` → may use feature/data-access/util/types only. `scope:<x>` → may use `scope:<x>` + `scope:shared` only. **A service can never depend on another service's libs.** Untagged → depends on nothing.

## Service anatomy (DDD, per service)

```
apps/<x>-service/src/
├─ main.ts                      # bootstrap as a hybrid HTTP+RMQ microservice; enableShutdownHooks()
├─ app.module.ts
├─ db/                          # this service's Drizzle schema + drizzle.config.ts + migrations (own DB)
│  └─ schema/<domain>/*.table.ts (+ *-translations.table.ts)
└─ modules/<feature>/
   ├─ <feature>.module.ts
   ├─ presentation/             # controllers (gateway-facing) + @MessagePattern / @EventPattern handlers
   ├─ application/             # services / use-cases (thin handlers call these)
   ├─ domain/                  # events, value objects, domain errors, internal types
   ├─ infrastructure/          # repositories (extend base repo) + model-config
   ├─ i18n/{ar,en}.json        # if it emits user-facing strings
   └─ <feature>.md             # DOC1 — kept in sync
```

DTOs/contracts are **never** local — they come from `libs/contracts` (U3, N4).

## Data layer (Drizzle + Postgres, per service)

- Each service: its own database, its own `drizzle.config.ts`, its own `db/schema` + migrations folder (MS5). Distinct DB per service avoids the `__drizzle_migrations` collision.
- **Base repository** (`libs/shared/database`): fluent `where/whereIn/with/withCount/withTrashed/scope` + terminals `find/findOrFail/first/paginate/paginateFiltered` + CRUD `create/createMany/update/delete(soft)/restore/forceDelete`. Per-model `ModelConfig` declares `hidden`/`fillable`/`casts`/`appends`/`scopes`/`softDeletes`/`translatable`.
- **TranslatableRepository** mixin: `createLocalized/updateLocalized/findLocalized/findAllTranslations`. Reads merge the active-locale row; writes go to `*_translations(fk, locale, …)` with a unique `(fk, locale)`.
- **Helpers:** `timestamps()`, `pk()`, soft-delete `deleted_at`, partial unique indexes (`WHERE deleted_at IS NULL`) for re-creatable keys.
- **DateTime service** (N3): all "now" + timezone conversion; DB stores UTC.

## Contracts (`libs/contracts`)

Single source of truth, imported by services + frontends:
- `common/` — `envelope` (`{ success, message, data, path, timestamp }`), `pagination`, `localized-text` (`{ ar, en }`), `list-query` helper, `locale` (`ar`|`en`, default `ar`), `direction` (`rtl`|`ltr`, `directionForLocale`).
- `messaging/` — message-pattern names + payload schemas for request/reply (MS2) and event payloads (MS3).
- `<domain>/` — per-service request/response schemas (`*.request.ts` Zod, `*.response.ts` types, `*.list-query.ts`).

## API gateway

- Plain NestJS HTTP app + registered `ClientProxy`s (RabbitMQ), one per service, via `ClientsModule.registerAsync` (config from `ConfigService`/env accessor).
- Validates the JWT once (guard), attaches `userId`/`roles` to outgoing RMQ message headers (MS4). Reads → `client.send(pattern, payload).pipe(timeout(), catchError())`; aggregates with `forkJoin`/`Promise.all`. Writes → `client.emit`.
- Applies the global envelope interceptor + exception filter + Zod validation pipe (from `libs/shared/util`).
- In production, sits behind nginx (TLS, rate-limit, WAF) — the Nest gateway is app-level routing, not the hardened edge.

## Frontends

### Website (Next.js App Router) — see `04-website.md`
- Server components fetch resolved content from the gateway (typed fetch client on `libs/contracts`) for SEO; client components own animation.
- Branding/visual-identity from settings-service with coded defaults (never blank). ar default + RTL.

### Portals (React + Vite) — admin + client
- App Router-less SPA with a route layer (React Router) + the **Sidebar+Topbar shell** (W1).
- **Redux Toolkit + RTK Query**, registered via `apiRegistry` (from `libs/web/data`); `baseQueryWithAuth` = refresh (`POST /auth/refresh { refresh }`) + envelope unwrap + auth header.
- **Client event bus** for cross-module freshness (W4); shared `*-lookup.api` + `ServerSelect` for cross-module/backend reads (W5).
- Module layout mirrors the smart-restaurant pattern: `modules/<X>/{api,components,hooks,i18n,index.ts}` + `shared/`. Logic in `use-*` hooks (U5).

## Theming & i18n

- **Tokens** (`libs/web/ui`): color (light+dark, brand from settings at runtime), spacing, radius, typography (Arabic + Latin scale), shadows/elevation, z-index layers. No hardcoded values (U6).
- **i18n** (`libs/web/i18n` + per-module catalogs): `ar` (default) + `en`, identical key trees (U8/F13), registered eagerly at import. RTL via logical properties + `directionForLocale`. Format helpers cache `Intl` instances (F8).

## Auth (identity-service + gateway)

- Email/password + **JWT access + refresh**; refresh body field is `refresh` (matches the canon); RBAC roles & permissions.
- The gateway is the trust boundary (MS4). Staff and clients are both `user`s distinguished by role; the client portal authorizes the `client` role + ownership scoping (a client sees only their own projects).

## Testing (TDD1–TDD2)
- Backend: Jest unit + e2e per service; DB-touching tests against the service's `*_test` database (Docker-provisioned). Contract tests assert handlers honor `libs/contracts`.
- Frontend: component + hook tests (Vitest/RTL); MSW for API; i18n parity test.
