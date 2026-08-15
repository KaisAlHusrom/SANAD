# سند التقنية — Sanad Tech Platform

> The prime directive for this repository. Read this first, every session.

## What this is

**Sanad Tech (سند التقنية)** is a software house that builds full software projects (SaaS, mobile, LMS, ERP…) for clients — designed and delivered **phase by phase**, with **weekly owner meetings** and **post-delivery support**. "Sanad" means *support / backing* → **trust** is the brand's core feeling.

This monorepo is the company's own platform:

1. **Company website** — public, premium, fully animated, **Arabic-first**, every piece of content (text, images, numbers, visual identity) served from the backend.
2. **Management / ERP portal** — internal, for admins + staff (developers, designers, QA, blog writers, business managers…): projects/phases/tasks, timesheets, CRM, HR, finance, support — and **management of all website content**.
3. **Client portal** — clients follow their projects phase-by-phase, review/approve deliverables, message the team, pay invoices, raise support tickets, and request new work.

All on a **NestJS microservices backend** behind an API gateway, brokered by **RabbitMQ**, in an **Nx monorepo**.

## Authoritative decisions (do not relitigate — change explicitly via the rules change-log)

| Area | Decision |
|---|---|
| Monorepo | **Nx** + pnpm. `@nx/enforce-module-boundaries` with `scope:`/`type:` tags. |
| Backend | **NestJS microservices**, **incremental** (start with the few services the website + admin need; extract more later). |
| Service comms | **RabbitMQ** (self-hosted, in our Docker stack, all envs): `@MessagePattern` request/reply for reads, `@EventPattern` + **transactional Outbox** for writes, **idempotent consumers**. |
| Data | **Database-per-service** (each owns its DB + Drizzle config + migrations). **Postgres** + **Drizzle**. Per-domain DDD layering. |
| Shared patterns | Base + Translatable repositories, DateTime service, response envelope, Zod validation — live in **`libs/shared`** / **`libs/contracts`**, reused by every service. |
| Identity | **One Identity service, scoped roles** (staff roles + client role), JWT access+refresh, RBAC. Gateway validates JWT once and forwards identity in RMQ headers. |
| Website | **Next.js** (App Router) — server components for SEO + content, client components for animation. |
| Portals | **React + Vite** (admin + client) — RTK Query, shadcn on tokens, the W-canon. |
| Locales | **Arabic default (RTL)**, English secondary. Logical properties only; per-module i18n with key parity. |
| Content | Website is 100% DB-driven (settings-service branding + content-service CMS), with **coded defaults** so nothing renders blank. |
| Environments | **dev / staging / production**, selected by **`APP_ENV`** (never `NODE_ENV` — it's always `production` once deployed). One typed env accessor per app. |
| Dev runtime | Full Docker stack (services + per-service Postgres + Redis + RabbitMQ + nginx) with **hot-reload bind mounts** — no rebuild on edit. |
| Deployment | `infra/` (monorepo-native port of bishola-deployment-v2): Dockerfiles, nginx + acme SSL, deploy/backup/renew/health/monitor/validate scripts, R2 backups. |
| Storage / images | **Cloudflare R2** (+ CDN) via a reusable media service. |
| Method | **TDD** for every module (backend + frontend); a **per-module `<module>.md` doc** kept in sync; DB-touching tests use a dedicated **`*_test` database**. |
| AI assistant (later) | **Claude / Anthropic** via the official SDK (changeable). |

**Reference projects** (read-only patterns on this machine — *learn from, never import*): `smart-restaurant`, `Bishola/docs/v2`, `bishola-deployment-v2`.

## Priority

Ship **website + admin dashboard** (admin fully controls website content + sees stats) → **deploy staging then production** → *then* build the ERP/client-portal services. The build spine is `.claude/plans/02-mvp.md` (phases **P0 → P9**).

> **⚠️ We are building the FINAL product — NOT an MVP.**
>
> `02-mvp.md` is a **filename**, not a quality bar. Nothing here is provisional, "good enough for
> now", or "fine because it's the MVP". Every phase ships its scope **finished on every axis** —
> logic, design, interaction, i18n, polish (U21). A cross-cutting gap is fixed **platform-wide**,
> never patched only at the screen where it was noticed. If doing it properly needs another
> session, **split the work — never lower the bar**. (Owner directive, 2026-07-20.)

## How every session must work

1. **Read `.claude/rules.md`** — the binding law (MUST/NEVER). Non-negotiable.
2. **Read `.claude/docs/PROGRESS.md`** — current state, next step, decisions, open issues.
3. **Read the relevant `.claude/plans/*`** — `02-mvp.md` for the next phase, plus the matching deep plan (`01-architecture`, `03-microservices-platform`, `04-website`, `05-deployment`, `06-ai-assistant`, `07-shared-ui-systems`, **`08-client-intake`** for P8.13–P8.20, **`09-client-portal`** for P8.21–P8.22).
4. **Build** following the rules + architecture. **TDD**: write the failing test first. Keep the module's `<module>.md` doc in the same change.
5. **Update `PROGRESS.md`** — what was done, what's next, decisions made, issues hit.
6. **Run the `verifier` agent** — it must report **PASS** before a phase is marked done. **Then run the `boot-verifier` agent** — bring up the Docker dev stack and confirm it actually runs (gateway answers through nginx, the phase's routes are mapped, no crash-looped container). The verifier checks *code*; boot-verifier checks *runtime* — a phase isn't done until both are green.
7. **Keep the rules lean (U13)** — session bugs, fixes, and "what I did" belong in `PROGRESS.md`, **not** `.claude/rules.md`. Add a rule ONLY for a genuinely reusable, platform-wide constraint that will recur; when unsure, ask. No rule-per-session.

## Commands & agents (project-local)

- `/continue-plan` — read rules + PROGRESS + plans, build the next `02-mvp.md` phase, update PROGRESS, run verifier.
- `/fix` — diagnose & fix a bug/regression/rule-violation, add a preventive rule, update PROGRESS, re-verify.
- `verifier` agent — checks built code against the exact rule IDs; runs typecheck/lint/build/test; greps for violations; reports PASS/FAIL.
- `boot-verifier` agent — runtime gate (run after `verifier`): brings up the Docker dev stack, confirms every container is up (no crash-loop), the gateway answers `GET /api/health` through nginx, and the phase's routes are mapped; reports UP/DOWN with the failing container's logs.
- `designer` agent — the single design language (tokens-only, dark+light, ar/en RTL; shadcn for portals, bespoke-animated for the website).
- `planner` agent — plans the next phase/feature; surfaces new settings, events, services, and modules.

## Golden rules (summary — full law in `.claude/rules.md`)

- **Module/service isolation.** A service NEVER imports another service; modules NEVER import each other's internals. Cross-service reads = RMQ request/reply; writes = events + Outbox; idempotent consumers. (U1, MS1–MS3)
- **Single source of truth.** Contracts (Zod + types) live once in `libs/contracts`. No duplicated DTO/shape. **Verify shapes, never invent them.** (U3, U15)
- **No `any`/`unknown`.** Strict TS; fix the type, never silence the compiler. (U4)
- **Design tokens only; full RTL; Arabic-first i18n with parity.** No hardcoded color/space/type; logical properties only; ar is the default locale. (U6, U7, U8)
- **Settings-with-defaults.** Every client/admin-configurable value resolves override → global → **coded default**; reads are null-safe to the leaf. (U9, F7)
- **Per-service own DB; DDD layering; base/translatable repos; never `new Date()`.** (N1–N5)
- **APP_ENV drives all config; secrets via env; dev in Docker with hot-reload.** (OPS1–OPS3, U19)
- **TDD always; DB tests use the `*_test` DB; every module has a synced doc; the `docs/postman` collection stays current with every endpoint.** (TDD1–TDD2, DOC1–DOC2)
- **Plans before building; PROGRESS is the ledger; always verify; rules grow.** (U11–U13)

> Start here, then `.claude/rules.md`, then `.claude/docs/PROGRESS.md`. When in doubt, the rules win.
