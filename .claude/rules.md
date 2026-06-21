# Sanad Tech — Rules (binding law)

> **These rules are append-only living law.** They are MUST/NEVER, greppable by ID, and specialized to this project (Nx · NestJS microservices · RabbitMQ · per-service Postgres · Next.js website · React/Vite portals · **Arabic-default** RTL · `APP_ENV`).
>
> **Legend:** **MUST** = always do. **NEVER** = never do. Each rule has a stable ID (`U1`, `N3`, `MS2`…). When you fix a bug or hit a recurring mistake, **add a rule** and a dated entry to the change-log at the bottom — never silently break a rule; change it explicitly.

---

## U — Universal (every app, every stack)

- **U1 — Module/service isolation.** Each feature is a self-contained module; it **NEVER** imports another module's internals. Cross-module/-service communication goes through a **typed bus** (backend: RabbitMQ events + request/reply; frontend: the client event bus + shared lookup apis). See MS1–MS3, N6.
- **U2 — Shared code lives in `libs/` only.** Anything used by 2+ modules/services lives in a `libs/*` package. A `libs/shared/*` package **NEVER** imports from an app or a feature module.
- **U3 — Single source of truth.** Never define the same type/contract/constant/logic twice. **All API + message contracts live once in `libs/contracts`** (Zod schemas + `z.infer` types), imported by every service and frontend. No duplicated DTO shapes.
- **U4 — No `any` / no `unknown`.** Explicit `type`/`interface` (or `z.infer`) for every entity, DTO, arg, return, prop, slice, message payload. Strict tsconfig (`strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`). **NEVER** `as any` / `@ts-ignore` to silence the compiler — fix the type.
- **U5 — Logic in hooks/services; the surface is thin.** Frontend: a component's logic (state, effects, fetching, handlers, derived values) lives in a co-located `use-*` hook; the component body is presentation-only. Backend: controllers/message-handlers are thin; logic lives in application services.
- **U6 — Design tokens only.** **NEVER** hardcode colors/spacing/radius/typography/shadows/z-index. Missing value → add it to the token system FIRST, then use it. **Theme scope:** the two **dashboards** support **dark + light**; the **website** is a **single fixed signature theme** (no toggle — WEB7). (Carve-out: genuine runtime data — a chart bar width, a canvas/WebGL coordinate — may be an inline style, marked with a comment.)
- **U7 — Full RTL / direction correctness.** Use logical properties (`start`/`end`, `ms-`/`me-`, `inset-inline-*`), never `left`/`right`. Mirror directional icons. Derive physical sides (Radix `side`, drawer slide direction) from the active direction. **Arabic is the default → RTL is the default**; LTR is the special case.
- **U8 — i18n.** All user-facing strings come from per-module i18n catalogs in **`ar` (default) and `en`**; **identical key trees across both locales** (verifier-enforced parity). Translatable *content* comes from the API/settings, never hardcoded. Language names are endonyms (العربية / English).
- **U9 — Settings-with-defaults.** Every admin/client-configurable value (branding, colors, logo, locale, feature toggles…) resolves **scope-override → global value → coded default**. The coded default is returned when unset so the product never renders blank. **NEVER** hardcode one configuration inline.
- **U10 — One concept per file.** Each enum/type/schema/constant-group is its own kebab-case file; `index.ts` is a **re-export barrel only**.
- **U11 — Plans before building; PROGRESS is the ledger.** Read `.claude/plans/*` + `.claude/docs/PROGRESS.md` before any work; build in `02-mvp.md` phase order; **every session updates `PROGRESS.md`** (done / next / decisions / issues).
- **U12 — Always verify.** After each work chunk run the **verifier** agent; typecheck + lint + build + tests must be green; pre-commit/pre-push hooks **NEVER** bypassed (`--no-verify` forbidden).
- **U13 — Rules grow (append-only living law).** Fixed a bug or hit a recurring mistake → **add a rule here** with a dated change-log entry. Never silently break a rule; change it explicitly.
- **U14 — No secrets in code; env-based config.** All secrets via env. Reference projects are read-only patterns — **NEVER** import from them.
- **U15 — Verify shapes, never invent them.** Before defining any type/DTO representing data crossing a boundary, **verify the canonical shape against the source of truth** (the Drizzle schema, the service's actually-returned object, the message contract) and cross-check an existing consumer. **NEVER** fabricate a field — the compiler accepts invented shapes and runtime then fails silently. New endpoint/message → contract-typecheck pass FIRST.
- **U16 — Validated shapes are Zod-first, file-name split.** Anything validated at runtime (request body, query/params, form input, message payload) is a **Zod schema**; its type is `z.infer`. Runtime-validated schemas+types → `*.zod.types.ts`; non-validated shapes (response DTOs, route/nav params, literal unions) → `*.types.ts`. **NEVER** duplicate a shape between a schema and a hand-written interface.
- **U17 — Modules own features; infrastructure is shared (litmus).** Before placing a hook/component/util/type in a feature module, ask: *"would a future, unrelated module need this?"* If yes → it's infrastructure, it lives in `libs/`, regardless of which feature first surfaced it. Generic request shapes (query/filter/sort/pagination) are **always** shared.
- **U18 — Every constant has a home; no bare inline literals.** A reusable design number → a **token**. A component-private number (card width, TTL, placeholder count) → a colocated `<thing>.constants.ts`. **NEVER** a bare numeric literal inline (allowed: `0`, `1`, platform-required exacts).
- **U19 — One typed env accessor (`APP_ENV`).** Env values are read through **one** typed accessor module per app (`env.ts` / `Env`), never raw `process.env` / `import.meta.env` at call sites (enforce with `no-restricted-imports`). **All environment branching uses `APP_ENV` (`development`|`staging`|`production`), never `NODE_ENV`.** The accessor validates at startup and **fails fast** on a missing required key; it supplies a production fallback per public key so a mis-built release still reaches the real backend.

---

## N — NestJS backend (per-service)

- **N1 — Base repositories.** All DB access goes through the shared enhanced base repositories (`libs/shared/database`), with a `Translatable` mixin for translatable tables. Per-model config declares `hidden`/`casts`/`appends`/`fillable`/`scopes`/`softDeletes`. **NEVER** ad-hoc queries in services.
- **N2 — Hidden fields & soft deletes.** Sensitive columns (e.g. `password`) declared `hidden`, stripped from output by default. Soft-deleted rows (`deleted_at`) excluded by a global scope; opt out only via `withTrashed()`.
- **N3 — DateTime service.** **NEVER** `new Date()` / `Date.now()` directly (ESLint `no-restricted-syntax`); use the timezone-aware shared DateTime service. DB writes are UTC; reads transform to the configured timezone.
- **N4 — Per-service own database + DDD layout.** Each service owns its **own database** (DB-per-service, MS5). Each module follows **presentation / application / domain / infrastructure** layering. **DTOs come from `libs/contracts`** (no local `dto/`). Raw SQL schema-qualifies table names.
- **N5 — Translation tables.** Any translatable column gets a dedicated `*_translations` table (locale-keyed); never store multiple languages in the base row. Single-item reads expose a per-locale `translations` map for edit forms.
- **N6 — In-service event bus + the network boundary.** *Within* a service, modules may use an in-process event bus for side effects. *Across* services, use RabbitMQ only (MS1–MS3). **NEVER** reach into another service's DB or import its code.
- **N7 — Validation & filtering.** Validate all input with Zod from `libs/contracts` via a `ZodValidationPipe`; request DTOs are `.strict()` (reject unknown keys). List endpoints accept **whitelisted, per-resource** filters via a shared `FilterSpec` — **NEVER** raw client column/operator passthrough. Boolean params use a strict `'true'|'false'` transform, never `z.coerce.boolean()`.
- **N8 — Auth & RBAC.** Email/password + JWT access+refresh + RBAC (roles & permissions) — owned by the **Identity service**. Other services trust the gateway-validated identity in the message headers (MS4); guards on every protected gateway route.
- **N9 — Envelope + errors.** A global response interceptor wraps payloads in the standard envelope `{ success, message, data, path, timestamp }`; a global exception filter standardizes errors (incl. Postgres error codes). Defined once in `libs/shared/util`, applied by every service/gateway.
- **N10 — Reproducible emit builds.** Gitignore `*.tsbuildinfo`; don't rely on `incremental` for emit builds. After `drizzle-kit generate`, verify migrations schema-qualify `pgSchema` enum types before applying.
- **N11 — NestJS apps are ESM + SWC (decorator metadata is load-bearing).** Every NestJS app is ESM (`"type":"module"`, `module:nodenext`) **transpiled by SWC** — `.swcrc` MUST set `transform.decoratorMetadata:true` + `legacyDecorator:true` + `keepClassNames:true` and `tsconfig.app.json` MUST set `experimentalDecorators`+`emitDecoratorMetadata`. **NEVER** transpile a Nest app with esbuild/tsx (they don't emit decorator metadata → Nest DI fails at runtime). `import 'reflect-metadata'` is the **first line** of `main.ts`. `tsc` is typecheck-only; SWC owns the runtime `dist`. Hand-roll the app (no `@nx/nest`/`@nx/node` generators) with explicit `nx:run-commands` `build`/`serve` targets; dev hot-reload = `swc --watch` (requires the **`chokidar`** devDep) + `node --watch`, `dependsOn:["^build"]` so lib `dist` exists first. Make controllers thin against an abstract-class seam so tests construct them directly (no DI metadata needed in vitest).

---

## MS — Microservices (the network boundary)

- **MS1 — Services never import other services.** Enforced by `@nx/enforce-module-boundaries` (`scope:*` tags). A service depends only on its own libs + `scope:shared`. A boundary-crossing import **must fail lint**.
- **MS2 — Cross-service reads = RMQ request/reply.** Use `@MessagePattern` over neutral query contracts in `libs/contracts`; the caller **MUST** add `timeout()` + `catchError` (request/reply has no built-in timeout). Exactly one responder per pattern. The gateway aggregates multi-service reads (API composition: `forkJoin`/`Promise.all` over `firstValueFrom`).
- **MS3 — Cross-service writes = events + Outbox.** Publish domain events with `@EventPattern`. A publisher **MUST** write the business row and the **outbox row in the same local transaction**; a relay publishes from the outbox. **NEVER** dual-write to DB + broker directly.
- **MS4 — Gateway is the only public entry.** Clients talk only to the API gateway. The gateway validates the JWT once and **forwards identity (userId/roles) in RMQ message headers** — never the raw token. Internal services are not publicly reachable (network-isolated). Sensitive services may re-validate (defense-in-depth).
- **MS5 — Database-per-service.** Each service owns its DB + its own Drizzle config + migrations folder; **NEVER** a shared DB or cross-service join. If services share one Postgres instance (dev), each uses a **distinct database** (or distinct `migrations.table`/`schema`) to avoid the Drizzle `__drizzle_migrations` collision.
- **MS6 — Idempotent consumers + safe delivery.** Consumers **MUST** be idempotent (record processed message IDs in the same tx as the business update). Use **manual ack** (`noAck:false`), **durable** queues + **persistent** messages, a sensible `prefetchCount`, and a **dead-letter queue + retry counter** (never infinite requeue).
- **MS7 — Sagas for multi-service writes.** Any workflow spanning services uses a **saga** (choreography first) with **compensating actions** — never 2PC, never assume ACID across services. Accept eventual consistency; design compensations to be idempotent.
- **MS8 — Observability & lifecycle.** Propagate OpenTelemetry trace context through AMQP headers. Every service exposes **liveness + readiness** (`@nestjs/terminus`), calls `app.enableShutdownHooks()`, and **drains in-flight RMQ messages on shutdown** (cancel consumer, bounded timeout) for zero-downtime rollouts.
- **MS9 — Incremental extraction.** Domain logic lives in `libs/` with `scope:`/`type:` tags. A new service is created by promoting a **stable** lib to an app once its boundary has held — not speculatively. Don't over-split (avoid the distributed monolith).

---

## F — Frontend (website + both portals)

- **F1 — One API layer, one envelope contract.** All server calls go through a central client whose base layer **unwraps the `{ success, message, data }` envelope** and extracts the standard error message in ONE place. Token refresh + auth header live there too. Match the backend's **real** refresh path/body (`POST /auth/refresh { refresh }` — verify, U15).
- **F2 — Loading is a skeleton; empty NEVER flashes during load.** Default loading affordance is a **skeleton shaped like the content**. Render-gate order is ALWAYS `loading-or-refetching → error → empty → data`; never let undefined/stale data fall through to the empty branch. Spinners only for the infinite-scroll tail and in-button mutation-pending.
- **F3 — Every list/detail ships explicit skeleton, empty, and error states** — from the shared component set, not ad-hoc.
- **F4 — Single-flag toggles are optimistic; tracking is fire-and-forget; only list-shape changes invalidate.** A boolean flip patches the cache optimistically, awaits, reconciles, rolls back on error — never refetches the whole list. Analytics/tracking is fire-and-forget, never invalidates or surfaces errors. Invalidate/refetch only for create/delete/reorder.
- **F5 — Freshness is event-driven.** Any view showing server data **subscribes** (client event bus) to events that could mutate it and refetches; a view with local pagination resets its buffer on the event. Cross-view sync goes through the event bus, not tag invalidation alone.
- **F6 — Forms are schema-validated.** A form library + a **Zod schema** (U16); messages are **i18n keys**; a user-action value-set marks the form dirty, a system/server prefill does not.
- **F7 — Settings reads are null-safe to the leaf.** Every settings access is optional-chained at EVERY level with a real coded default: `settings?.a?.b?.c ?? DEFAULT`. The compiler will NOT catch a missing group (stale cache, un-deployed backend, disabled group, first-paint gap). The default equals the backend's coded default (U9).
- **F8 — Display formatting via shared helpers.** Date/time/number/currency/phone display comes from **shared, locale- and settings-aware** format helpers that cache their formatter instances. **NEVER** inline `Intl.*`, `toLocale*`, or a date library at a call site.
- **F9 — Reuse before create.** **Actively search** the shared component library before writing ANY component; a missing primitive is added to the shared lib first, never inlined as a duplicate.
- **F10 — The shell owns chrome.** Header/nav/system chrome is defined ONCE at the shell/layout level; views never re-render their own header. Documented full-screen/wizard exceptions only.
- **F11 — In-app settings beat the device.** The app's persisted language/direction/theme is authoritative and **overrides** device locale, OS RTL, and system color scheme (except a sensible first-launch default).
- **F12 — Critical-path state seeds the first frame synchronously.** Theme, language, direction seed their initial value from a synchronous storage read at module load — never async hydration alone.
- **F13 — i18n is per-module, parity-checked, registered eagerly.** Each module owns `i18n/{ar,en}.json`, merged at module-**import** time (not in an effect). Key trees identical across locales (verifier-enforced). Brand/canonical strings come from a single source.

---

## W — Web portals (React + Vite: admin + client)

- **W1 — Dashboard shell.** Every portal view uses one **Sidebar + Topbar + Content** shell; no page invents chrome.
- **W2 — shadcn/ui + tokens.** Use shadcn primitives on the token system; don't pull in other UI kits. Never `max-w-*` a layout container (dead gutters); lay out with grid/flex + `gap` (never `space-x/space-y`).
- **W3 — Data layer.** Redux Toolkit + **RTK Query**, registered via an `apiRegistry`; `baseQueryWithAuth` does token refresh + envelope unwrap + attaches the auth header (+ scope header if applicable). Store back-edges (`RootState`/`store`) are **`import type` only**.
- **W4 — Client event bus (reactivity).** Every state-changing mutation **publishes** a typed domain event in `onQueryStarted` after success; cross-module reads **subscribe** and invalidate. Same-module refresh uses RTK tag invalidation. A live board showing other users' writes **polls** (the bus only sees same-tab writes).
- **W5 — Cross-module reads bridge via a shared `*-lookup.api`** — never import another module's api/hook. Backend-sourced pickers use a shared **server-searched `ServerSelect`**, never a preloaded `<Select>` with a huge `pageSize`. Plain `<Select>` only for fixed coded enums.
- **W6 — Translatable & toggle conventions.** A translatable entity is edited in **both** locales (per-locale tabs; edit prefills from the detail `translations` map). A toggleable status cell renders an inline **Switch** wired to the update mutation (perm-gated), not a static badge.

---

## WEB — Website (Next.js, public, content-driven, animated)

- **WEB1 — Content-driven, nothing hardcoded.** Every text/image/number/visual-identity value renders from the gateway (content-service + settings-service). Marketing copy is **never** hardcoded in a component. Coded defaults (U9/F7) cover first-paint and missing content.
- **WEB2 — SEO-first data fetch.** Page content is fetched in **server components** (App Router) for SEO and shared via a typed fetch client built on `libs/contracts`. Client components handle interactivity/animation only.
- **WEB3 — Animation stack, used deliberately.** Lenis (smooth scroll) + GSAP/ScrollTrigger (pin/scrub/parallax) + Framer Motion (transitions, in-view, hover) + React-Three-Fiber (WebGL hero). Animate transform/opacity only; lazy-load the R3F canvas.
- **WEB4 — Reduced motion is mandatory.** Honor `prefers-reduced-motion`: gate Lenis instantiation, kill parallax/scroll-reveal/animated gradients/autoplay, swap x/y motion for opacity. Essential feedback stays.
- **WEB5 — Arabic text animation splits by WORD, not letter.** Arabic is cursive/joined — letter-splitting breaks ligatures/glyphs. Use a word-splitter for staggered reveals. **NEVER** `letter-spacing` on Arabic.
- **WEB6 — RTL motion direction.** Horizontal motion reverses under RTL (a right-side drawer slides from the right). There is no logical property for `transform` — flip via a `[dir="rtl"]`-scoped CSS custom property feeding the keyframes. Do NOT mirror logos, media controls, numbers, or charts.
- **WEB7 — The website is a single signature theme (no toggle).** The website has ONE fixed, bespoke art direction — that fixed look *is* the brand identity. **NEVER** add a dark/light switch to the website (theme toggling lives only in the dashboards, U6). Removing the toggle is intentional: it buys one perfect opinionated aesthetic instead of two safe ones.
- **WEB8 — Sound is opt-in, gestured, and muteable.** Any website audio **NEVER autoplays**; the AudioContext unlocks on the first user gesture, then an ambient bed may fade in. A **persistent, always-visible sound on/off toggle** (default **off**, choice persisted) is mandatory. Cues fire only on **meaningful** events (hero-object grab/release, section arrival, primary CTA) at low volume — **never** on every hover. Pair sound with `prefers-reduced-motion` ("calm mode" = motion + sound off); nothing is audio-only.
- **WEB9 — Singular identity, no templated clichés.** The design must be unmistakably **سند التقنية** and no one else. **NEVER** reach for the over-used moves (generic particle/dot fields, drifting aurora-blob backgrounds, default-lit spinning 3D primitives, magnetic-button + giant inverting cursor, word-by-word reveal of every paragraph, scroll-jacked horizontal galleries, badge walls, "scroll to explore" chevrons, fake typewriter/percentage loaders, infinite logo marquees, autoplay media). Invent one or two ownable signatures (a brand-specific cursor/hero/sound) and favor restraint over piling on effects.
- **WEB10 — The landing page is one scroll-choreographed journey around a persistent central element.** Sections are NOT independent stacks: a single **persistent central object stays centered and travels the whole scroll, morphing per section** (Active Theory-style), and at the works section becomes a **spine the project cards orbit around**, driven by scroll progress while the section is **pinned**. Build it on **one normalized scroll-progress (0→1)** feeding a fixed full-viewport layer (Three.js/R3F, or a pinned SVG/DOM element) with GSAP ScrollTrigger **pin + scrub** synced to Lenis. It **MUST** be scroll-**linked, never scroll-jacked** (native scrollbar/keyboard/find-on-page intact; transform/opacity only for 60fps); mobile simplifies to a lighter/static central element; `prefers-reduced-motion` settles it into clean static per-section states (WEB4); RTL flips the sign of orbit direction + any left/right motion via a `--dir: 1/-1` scalar (WEB6).

---

## OPS — Deployment & environments

- **OPS1 — `APP_ENV` drives all config.** Three environments — `development`, `staging`, `production` — selected by **`APP_ENV`**, never `NODE_ENV`. Each app has `.env.development` / `.env.staging` / `.env.production` (+ a committed `.env.example`); real env files are gitignored.
- **OPS2 — Dev runs in Docker with hot-reload.** The dev stack (`infra/docker-compose.dev.yml`) runs every service + per-service Postgres + Redis + RabbitMQ + nginx with **bind-mount + watch** so code edits hot-reload **without rebuild/restart**. The dev stack mirrors staging/prod topology.
- **OPS3 — Self-hosted infra, in-stack.** Postgres, Redis, and **RabbitMQ** run as our own containers in all environments — no managed/third-party broker. nginx terminates TLS with **acme** (Let's Encrypt). DB backups are produced by scripts and pushed to **Cloudflare R2**.
- **OPS4 — Never bypass hooks.** Pre-commit/pre-push (lint, typecheck, build, tests) are never bypassed. Deploys go through the `infra/scripts/deploy.sh` flow (migrate → build → health-check → rollover), staging before production.

---

## DOC — Documentation

- **DOC1 — Every module has a synced doc.** Every backend service-module and every frontend feature-module has a colocated `<module>.md` (purpose, entities, contracts, events consumed/emitted, settings used). It is **updated in the same change** that modifies the module — a module change with a stale doc fails review.

---

## TDD — Testing

- **TDD1 — Test-first, backend and frontend.** Every module/feature is built TDD: write the failing test first, then the code. No feature is "done" without tests proving its acceptance criterion.
- **TDD2 — DB tests use the `*_test` database.** Any test touching a database runs against that service's dedicated **`*_test`** database — **NEVER** the development or production DB. Each service's test DB is isolated per MS5.

---

## Change-log

> Append a dated entry whenever a rule is added or changed. Format: `YYYY-MM-DD — <ID> <added|changed> — <why>`.

- 2026-06-18 — Initial ruleset seeded from the cross-project canon (U/N/F/W) and specialized for Sanad Tech: added **MS** (microservices), **WEB** (animated content-driven website), **OPS** (deployment/`APP_ENV`), **DOC** (per-module docs), **TDD** (test-first + `*_test` DB) families; set Arabic as the default locale and RTL as the default direction; replaced the in-process QueryBus rule with RMQ request/reply (MS2) and the in-process event bus with events+Outbox across the network boundary (MS3); set database-per-service (MS5).
- 2026-06-21 — **U6/WEB7 clarified (design tokens locked from imported designs).** Brand type = **IBM Plex Sans Arabic** (display+text) + **IBM Plex Mono** (labels/code), self-hosted WOFF2; **numerals are Western digits** platform-wide (one numeral system per U8). Website single dark theme base `#05080d` with per-page accents (landing `#22d3ee`, about `#2dd4bf`, services `#38bdf8`, detail `#6366f1`); portals dual dark+light via CSS custom properties. Authoritative values live in `.claude/design/design-spec.md`, seeded in `@sanad/config`. Reason: Claude designs imported — lock values so P7/P8 don't re-invent them.
- 2026-06-21 — **WEB10 amended (signature element, owner decision).** Keep the persistent central object + scroll-scrubbed orbiting work-cards, but **remove the literal sci-fi telemetry HUD** (`km/s` velocity + `SND-xx` star-map coordinates); retain a restrained top scroll-progress bar. Reason: the HUD read as a space game, not a trust/mastery/craft software house.
- 2026-06-21 — **P0 build note (no rule weakened).** Shared libs ship framework-agnostic core + typed contracts under TDD; the **NestJS adapters** (guard, RMQ transport, response interceptor/exception filter/Zod pipe, terminus) are deferred to P1/P2 where a running app validates them — honoring TDD1 (no untested decorator code).
- 2026-06-22 — **N11 added.** Building the first NestJS app (`api-gateway`) in P1 surfaced that SWC (not esbuild/tsx) is required for Nest decorator metadata, and that `swc --watch` needs the `chokidar` devDep (the dev container crashed its watcher without it). Codified the ESM+SWC app toolchain so every future service follows it instead of re-discovering the trap.
