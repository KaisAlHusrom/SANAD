# 02 — MVP build order (the spine)

> This is the ordered, buildable phase list `/continue-plan` walks. **Priority: website + admin dashboard, then deploy.** Each phase: scope → tasks → **Done when** (acceptance) → which plans/rules apply. Build **TDD** (write the failing test first). Mark a phase `[x]` in `PROGRESS.md` only after the `verifier` agent reports PASS. Don't start a phase before the previous one's "Done when" holds.

---

## P0 — Monorepo & shared platform
**Scope:** the empty-but-correct skeleton everything builds on.
**Tasks:**
- `npx create-nx-workspace` (integrated, pnpm). `nx.json`, `tsconfig.base.json`, strict TS (U4), prettier/eslint presets in `libs/shared/config`.
- Husky + lint-staged + commitlint; `@nx/enforce-module-boundaries` with `scope:`/`type:` tags (MS1).
- `libs/contracts` — `common/{envelope,pagination,localized-text,locale,direction,list-query}` (Zod + types).
- `libs/shared/database` — `BaseRepository`, `TranslatableRepository`, `ModelConfig`, drizzle helpers (`pk`, `timestamps`, soft-delete), `DateTime` service (skeleton + tests).
- `libs/shared/messaging` — RMQ transport config factory, event-contract base, request/reply helper (with `timeout`), `Outbox` interface, `IdempotentConsumer` helper (skeletons + tests).
- `libs/shared/auth` — JWT guard, identity-context, RBAC decorators (skeletons).
- `libs/shared/util` — typed env accessor (`APP_ENV`, U19), response-envelope interceptor, exception filter, Zod validation pipe, terminus health, graceful-shutdown helper.
**Done when:** `nx run-many -t build,typecheck,lint` is green AND a deliberately added cross-`scope` import **fails** `enforce-module-boundaries`.
**Applies:** `01-architecture.md`; rules U1–U19, MS1, N9.

## P1 — Dev infrastructure (Docker, hot-reload)
**Scope:** the local stack that mirrors prod and hot-reloads.
**Tasks:**
- `infra/docker-compose.dev.yml`: Postgres (one container, one DB per service), Redis, **RabbitMQ** (+ management UI), nginx, app containers.
- Dev Dockerfiles with bind-mounts + watch (`nx serve` / `tsx watch` / Vite HMR) — **no rebuild on edit**.
- `.env.development` / `.env.staging` / `.env.production` (+ `.env.example`) per app; wire the typed `APP_ENV` accessor; nginx dev vhosts route gateway + website + portals.
- A bootstrap `api-gateway` app with `GET /health` (terminus).
**Done when:** `docker compose -f infra/docker-compose.dev.yml up` boots Postgres+Redis+RabbitMQ+nginx+gateway; `GET /health` returns OK through nginx; editing a `.ts` hot-reloads with no rebuild; changing `APP_ENV` changes resolved config.
**Applies:** `05-deployment.md`; rules OPS1–OPS3, U19, MS8.

## P2 — Identity service + API gateway (TDD)
**Scope:** auth + RBAC end-to-end through the gateway.
**Tasks:**
- `identity-service` own DB: `user` (hidden `password`, argon2), `role`, `permission`, `role_permission`, `user_role`, `refresh_token`. Seed roles (admin + staff roles + `client`).
- Login, refresh (`{ refresh }`), logout; access+refresh JWT; RBAC permission checks (`<resource>.<action>`, `manage` wildcard).
- Gateway: auth routes + guard that validates JWT and forwards `userId`/`roles` in RMQ headers (MS4); an RBAC-guarded sample route.
- Contracts in `libs/contracts/identity`. Module docs (DOC1). Tests against `identity_test` DB (TDD2).
**Done when:** login + refresh work end-to-end through the gateway against the `*_test` DB; a guarded route rejects a user lacking the permission; verifier PASS.
**Applies:** `03-microservices-platform.md`; rules N1–N9, MS2/MS4, TDD1–TDD2, DOC1.

## P3 — Settings service (advanced, TDD)
**Scope:** the reusable configuration engine + branding.
**Tasks:**
- `settings-service` own DB: `setting` (key, type, requirement, options, defaultValue, scope, group), `setting_value` (scope-keyed), `setting_translation`.
- Resolution **override → global → coded default** (`SETTINGS_DEFAULTS` in code); Redis cache + version key; translatable values (ar/en).
- Branding/visual-identity group (colors, logo, fonts, social, contact). Request/reply pattern for `settings.resolve` (MS2). Gateway endpoint returning resolved branding.
**Done when:** the gateway returns resolved branding **with coded defaults when unset**; a typed settings read is null-safe to the leaf (F7); verifier PASS.
**Applies:** rules U9, N5/N7, MS2, F7.

## P4 — Media service (TDD)
**Scope:** image/file storage on R2.
**Tasks:**
- `media-service` own DB: `media_asset` (R2 key, type, size, alt, dimensions), `media_folder`; signed-upload flow to **Cloudflare R2**; CDN URL resolution; list/search.
- Gateway upload endpoint (auth + perm). Emits `media.deleted` (Outbox) for reference reconciliation.
**Done when:** an authorized upload returns a CDN URL and the asset is listed; verifier PASS.
**Applies:** rules MS3, OPS3.

## P5 — Content / CMS service (TDD, translatable)
**Scope:** everything the website renders.
**Tasks:**
- `content-service` own DB, translatable entities (+ `*_translations`): `page`/`section`/`block`, `service`, `portfolio_project`, `blog_post`/`blog_category`/`blog_tag`, `testimonial`, `faq`, `menu`/`menu_item`, `lead`.
- CRUD with base/translatable repos; whitelisted `FilterSpec` lists; per-locale edit reads (`findAllTranslations`).
- Contact-form submission → create `lead` + **emit `lead.created` via Outbox** (MS3).
- Gateway read endpoints for the website (aggregate where needed). Module docs.
**Done when:** content CRUD works in **both** locales; a contact submission persists a lead and emits a consumable `lead.created`; verifier PASS.
**Applies:** rules N1–N7, N5, MS3, DOC1.

## P6 — Notifications service (TDD)
**Scope:** email + in-app, event-driven.
**Tasks:**
- `notifications-service` own DB: `notification` (recipient, channel, type, payload, read_at), `processed_message` (idempotency, MS6).
- Subscribe to `lead.created` (+ `user.registered`) via `@EventPattern`; send email (provider via env) + create in-app notice; **idempotent** (same-tx processed-message insert).
- In-app notifications read endpoint via gateway.
**Done when:** a contact submission sends an email + creates an in-app notification **exactly once even on redelivery**; verifier PASS.
**Applies:** rules MS3, MS6, N9.

## P7 — Admin portal: website management (Vite, TDD)
**Scope:** the dashboard that controls the whole website + shows stats. **(priority surface)**
**Tasks:**
- `admin-portal` (Vite + React Router): Sidebar+Topbar shell (W1), RTK Query + `apiRegistry` + `baseQueryWithAuth` (W3), client event bus (W4), ar/en RTL + tokens, login.
- Modules: **settings/branding editor** (visual-identity), **content management** (pages, services, portfolio, blog, testimonials, FAQ, menus — translatable per-locale tabs, W6), **leads inbox**, **media library**, **users/roles**, **dashboard/stats** (from analytics/content counts).
- Skeleton→error→empty→data gates (F2/F3); ServerSelect for backend pickers (W5); module docs + i18n parity.
**Done when:** an admin can create/edit/publish **every** website surface (content, blog, branding, menus, FAQ) and view stats; all in ar + en; verifier PASS.
**Applies:** `04-website.md` (content shapes); rules F1–F13, W1–W6, DOC1, TDD1.

## P8 — Website (Next.js, content-driven, animated)
**Scope:** the public premium site, 100% from the DB.
**Tasks:**
- `website` (App Router): server-component data fetch from the gateway (WEB2); branding hydrated from settings with coded defaults.
- Design system from `04-website.md`: tokens, Cairo/Tajawal + IBM Plex Sans Arabic, dark+light.
- Animation: Lenis + GSAP/ScrollTrigger + Framer Motion + R3F hero; **reduced-motion** fallback (WEB4); **word-split Arabic reveals** (WEB5); RTL motion (WEB6).
- Pages: landing, about, services (+detail), portfolio/case-studies (+detail), process, blog (+post), contact + **request-a-project** form, FAQ, careers, legal. SEO metadata per page.
**Done when:** the entire site renders from the DB in **ar (default) + en** with full RTL, animations working, and a clean `prefers-reduced-motion` fallback; the request/contact form creates a lead; verifier PASS.
**Applies:** `04-website.md`; rules WEB1–WEB6, F1–F13, U6–U8.

## P9 — End-to-end verify + DEPLOY (staging → production)  ← priority milestone
**Scope:** ship website + admin to real environments.
**Tasks:**
- `infra/docker-compose.staging.yml` + `infra/docker-compose.prod.yml`; production multi-stage Dockerfiles; nginx + **acme SSL**; per-service prod DBs.
- Scripts (port from bishola-deployment-v2): `deploy.sh` (migrate→build→health→rollover), `backup_db.sh` (+ R2 push), `renew.sh`, `health_check.sh`, `monitor.sh`, `validate_env.sh`.
- Deploy website + admin + their services to **staging**, smoke-test, then **production**.
**Done when:** website + admin run on staging **and** production with green health checks, valid SSL, and a successful DB backup (optionally pushed to R2); verifier PASS.
**Applies:** `05-deployment.md`; rules OPS1–OPS4, MS8.

---

## P8.6 — Currency & budget bands → configurable (owner-requested, do it FULLY in its own session)
**Why:** the request-a-project budget bands + the `SAR` currency are frozen in code
(`apps/website/src/components/marketing/request/request.constants.ts:32-35`), and those exact
display strings are **persisted onto every lead record** — so renaming a band silently breaks the
comparability of historical leads. Owner directive (2026-07-19): *"currency has effect in a lot of
places, so yes we need to make it editable — but not this session; do it fully and correctly
without missing anything."*
**Done when:** currency (code + symbol + placement) and the budget bands are admin-configurable and
take effect everywhere they render; leads store a **stable band code** (not the display label) with
the label resolved at read time, and existing lead rows are migrated/back-filled so old leads stay
readable and comparable; every place that renders a money value (request form, lead admin, exports,
notification emails) resolves from the one source. Needs a deliberate sweep for money literals
first — do not guess the call sites.

---

## After P9 (later — each gets its own feature plan when reached)
P10 client-portal + projects-service · P11 crm-service · P12 hr-service · P13 finance-service · P14 support-service · P15 documents/e-sign · P16 ai-assistant (`06-ai-assistant.md`). Scope in `00-full-system.md`.

## Working agreement for every phase
1. Read rules + PROGRESS + this phase + the linked deep plan. 2. Write failing tests first (TDD). 3. Build to the rules. 4. Write/update the module `<module>.md` (DOC1). 5. Update PROGRESS. 6. Run `verifier` → must PASS. 7. If a bug taught a lesson, add a rule (U13).
