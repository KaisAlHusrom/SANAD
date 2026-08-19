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

---

# P8.7 → P8.23 — CLIENT-READINESS (everything that must exist before ads bring real clients)

> **Why this block exists.** The owner deploys and **immediately starts running paid ads**. Before that,
> the platform has to be able to _take_ a client, not just collect an email. Audit of 2026-08-08 (read
> from the code, not inferred): **no contracts / proposals / e-sign / documents exist at all**; there is
> **no client entity** (the `client` role is seeded with zero permissions); a `lead` has **no phone**, no
> owner, no notes, no activity, no conversion; `POST /api/leads` is **public with no throttler, helmet,
> CORS policy, captcha or honeypot**; there is **no password reset, no email verification, no login
> lockout**; **no ad conversion tracking and no consent**; a failed email **stays failed forever**; and
> there is **no audit log, no PDF, no sequential numbering**. Full plan + evidence:
> `docs/plans/08-client-intake.md` and `docs/plans/09-client-portal.md`.
>
> **Owner decisions, 2026-08-08 (do not relitigate):** ① e-signature is built **in-house** behind the
> existing capability→provider→active seam, so a DGA-licensed CSP is a later adapter; ② pre-deploy
> commercial scope is **clients + proposals + contracts** (invoicing/payments are P10, but the contract
> carries a first-class **payment schedule** so nothing is half-built); ③ the **client portal is built
> now**, to the `W7` reference tree, **not** the way `apps/admin-portal` is organised; ④ **no legal
> entity is registered yet** and the platform may be **sold to other tech companies**, so nothing about
> the company, its jurisdiction, its currency or its tax is hardcoded — the default template is
> deliberately **jurisdiction-neutral** and ships in `individual` party mode.
>
> **U0 applies to every phase below:** a phase is a unit of scope, not of time. Any of these that cannot
> be finished to the bar in one pass is **split further in `PROGRESS.md`** — that is expected, not a failure.

## P8.7 — The law update + the event catalog

**Scope:** the rules everything after this is built against, and the mechanism that enforces the event chain.
**Tasks:**

- `docs/rules.md`: **U0** verbatim as the first rule; **U26** (logic unit = folder + colocated spec), **U27** (complete event chain + `EVENT_CATALOG`), **U28/U29/U30** (ported generic Aysar law, renumbered), **W7** (client-portal reference tree); U20 amended to point at U26; one dated change-log entry recording provenance + the ID remap. **[DONE 2026-08-08 in the planning session.]**
- `libs/contracts/src/lib/events/` — the **`EVENT_CATALOG`**: one `<event>.event.ts` per event + a registry mapping `name → { payloadSchema, producer, consumers[] }`. **Backfill every event already emitted anywhere in the repo** (`lead.created`, `media.deleted`, `settings.changed`, `user.registered`, and the admin portal's client-bus events) — the audit is part of this phase and will surface today's orphans. **[DONE — 26 entries: 4 broker + 22 client-bus. The audit found 3 real defects, all fixed: `settings.changed` and `user.registered` had no schema (and `user.registered` no constant); `content.service.changed`/`content.blog.changed` were half-wired (published, nobody listening, while `DashboardCounts` counts exactly those collections); `settings.branding.updated` was declared, never published, never subscribed → deleted. 13 declared orphans carry reasons naming P8.11/P8.12/P8.23.]**
- Extend the **`verifier`** agent with the U26/U27 greps; add the ESLint file-layout check for U26. **[DONE — verifier bullets landed in the planning session; `sanad/u26-logic-unit-folder` in `tools/lint/`, registered at `error` in the ROOT flat config, with a generated 569-path baseline ratchet.]**
  **Done when:** `EVENT_CATALOG` declares every event currently emitted anywhere; the verifier **fails** on a deliberately un-catalogued event and on a deliberately flat logic file, then passes when both are removed; every existing orphan event carries an explicit `consumers: []` + reason.
  **Applies:** U0, U3, U26, U27, U13, MS3, W4.
  > **U26 rollout — owner directive, 2026-08-08:** _"only feature edits… I know that old work doesn't follow this, no problem; from now let's follow it and fix what's in our way."_ So there is **no bulk migration phase**. The rule ships at `error` with a committed **baseline ratchet** (569 pre-rule files, generated by `nx run lint-rules:baseline`): every NEW file must comply, and a baselined file a later phase **touches** is moved into its concept folder and struck from the list in that same change — enforced by the rule itself, which errors on a listed path that now complies. `maxPaths` only ever goes down.

## P8.8 — Platform primitives: audit, sequence, money

**Scope:** three shared libs every commercial phase depends on. Backend-only, pure TDD.
**Tasks:**

- **`libs/shared/audit`** — append-only trail. `audit_log` shipped as a shared Drizzle fragment each service mounts **in its own DB** (MS5): `actorUserId, actorRole, action, entityType, entityId, before, after, ip, userAgent, requestId, occurredAt`. Interceptor + `@Audited()` decorator. Rows are **never** updated or deleted. This is the legal evidence layer for e-signature — first, not after.
- **`libs/shared/sequence`** — gap-free human-readable per-entity per-year numbering (`PRO-2026-0001`, `CTR-2026-0001`, `INV-2026-0001`): DB counter + `SELECT … FOR UPDATE`, format configurable per entity via settings. `uuid` stays the PK.
- **`libs/shared/money`** — integer **minor units + ISO currency code**, never a float; locale-aware formatting (western numerals in `ar`, per the existing `formatBytes` precedent); tax from a configurable rate + label; explicit, tested rounding.
- Reuse `libs/shared/database` (`BaseRepository`, `DateTimeService` — N3, never `new Date()`).
  **Done when:** all three ship green against a `*_test` DB; **concurrent** sequence allocation produces no gaps and no duplicates; an audited handler writes an immutable row with actor + ip + before/after.
  **Applies:** N1, N3, N4, MS5, TDD1, TDD2, U26.

## P8.9 — Legal Entity Profile + configurable money (**absorbs P8.6**)

**Scope:** every fact about "the company" becomes a setting with a coded default → jurisdiction-neutral and sellable.
**Tasks:**

- New settings group seeded through `SETTINGS_CATALOG`: `legalName` (ar/en), `partyMode` (`individual` | `company`, **default `individual`**), `tradingName`, `registrationNumber?`, `taxNumber?`, `taxRate` + `taxLabel` (ar/en, **default 0 / disabled**), `address`, `jurisdiction`, `governingLaw`, `disputeForum` (`courts` | `arbitration`) + seat, `currencyCode`/`symbol`/`placement`, `signatoryName`, `signatoryTitle`, `signatureImageMediaId?`.
- **Resolves the deferred P8.6:** currency + request-form budget bands become admin-configurable; leads store a **stable band code**, not the display label; existing rows back-filled so historical leads stay comparable; every money render site resolves from this one source. **Sweep for money literals first** — `apps/website/src/components/marketing/request/request.constants.ts` is the known one, do not assume it is the only one.
- Admin: a purpose-built **Legal Entity** section with a live preview of the rendered entity block — **not** a key/value grid (U0).
  **Done when:** changing currency, tax, or party mode changes every rendered money value and every document entity block with **no code change**; a pre-migration lead still renders its band label; verifier PASS.
  **Applies:** U0, U9, U3, N7, F7, MS2.

## P8.10 — Gateway hardening + public-form protection

**Scope:** the day ads go live, `POST /api/leads` is the most attacked surface in the product.

> **Split into A/B/C on 2026-08-19 (U0).** The original single phase implied a first-in-repo global guard,
> a `lead.phone` change touching ~20 files across five projects, and a new integration provider — far past
> the ~6–8-file sizing bar. Same scope, same bar, three sessions. **C is deliberately sequenced into P8.23**:
> honeypot/time-floor/Turnstile only earn their keep once paid traffic starts, and all three degrade open,
> so they belong beside the consent + pixel layer rather than ahead of the deploy.

### P8.10.A — Gateway edge hardening

**Tasks:** Redis-backed rate limiting with per-route policies (aggressive on `/auth/login` and `/leads`), fed
**live from settings** with coded defaults and a 60 s TTL so limits are tunable from the admin mid-campaign
without a redeploy; `helmet`; explicit `APP_ENV`-driven CORS allow-list (deny-by-default — the admin is
same-origin and the website is SSR, so nothing needs CORS today); body-size limits; `trust proxy` so `req.ip`
is the real client; request-id generated when absent and propagated into the audit log. The guard **fails
open** on every path (Redis down, Redis hung, settings unreachable, ip unknown).
**Done when:** a scripted flood of `POST /api/leads` is throttled with a localized 429 **without** dropping a
legitimate submission from another ip; stopping Redis makes every request succeed again; a forged
`X-Forwarded-For` does not move the bucket; helmet headers + `X-Request-Id` on every response; an unlisted
`Origin` gets no `Access-Control-Allow-Origin`; verifier PASS + boot-verifier UP.
**Applies:** U0, U3, U9, U19, U24, U26, OPS1, N7, N12.

### P8.10.B — `lead.phone` + duplicate detection

**Tasks:** **`lead` gains `phone`** — contract + schema + migration + both website forms + the admin column +
the lead email template. A Gulf agency loses most inbound without a callable number. Lead spam scoring, and
duplicate detection (same email/phone in a window) landing as **`submissionCount` + `lastSubmittedAt` on the
existing lead plus an `audit_log` row** — _not_ a second lead row, and _not_ a new `lead_activity` table:
the activity timeline belongs to `crm-service` (P8.15, `08-client-intake.md` §5.1), so building one here
would create a concept that phase then has to own or migrate (decision 2026-08-19).
**Done when:** a phone number submitted from either website form reaches the admin column and the team email;
a repeat submission from the same email within the window increments the counter and writes an audit row
instead of creating a second lead; verifier PASS + boot-verifier UP.
**Applies:** U0, U3, U24, U27, N7, TDD1, TDD2, DOC1, DOC2.

### P8.10.C — Layered bot defence → **folded into P8.23 (2026-08-19)**

Honeypot field + time-to-submit floor + **Cloudflare Turnstile** behind the existing capability→provider→
active integration seam — configurable from the admin, **degrading open with a logged warning** when
unconfigured (never blocks a real lead), with failures recorded and visible in the admin. Tracked in P8.23.

## P8.11 — Identity completion

**Scope:** the auth flows a real product cannot launch without.
**Tasks:** password reset (request → single-use expiring token → set), email verification, staff **invitation**, self-service password change, login throttling + lockout with a localized reason, session/device list + revoke-all, and `client` role permissions wired for real (today `[]`). Every flow emits a catalogued event (`user.invited`, `user.verified`, `password.reset.requested`, `login.failed`, `login.locked`) and writes an audit row. Argon2 + the rotated refresh-token model are unchanged.
**Done when:** a locked-out admin recovers their own password end-to-end through the gateway; a brute-force attempt locks and says why in ar and en; every flow writes an audit row; verifier PASS.
**Applies:** N8, U24, U27, MS2, MS4, TDD1.

## P8.12 — Notifications completion

**Scope:** the service consumes exactly one event today and cannot retry a failed email.
**Tasks:**

- **Admin-editable, DB-backed template system**: ar/en subject + body, branded layout from settings, a **typed variable catalog** per template kind, live preview. Edited in a purpose-built structured editor reusing the admin's existing `rich-text` — **never** a raw HTML textarea (U0).
- Retry sweeper for `failed` rows with backoff + a dead-letter state; a delivery log surfaced in the admin.
- **Channel provider seam** extended for SMS/WhatsApp under the capability→provider→active pattern (needed for signing OTP; **email OTP is the coded default** so nothing blocks on a provider account).
- Subscribe to the events orphaned today (`user.registered`, `settings.changed`) and to every event the commercial phases add — the first real exercise of U27.
  **Done when:** an admin edits a template in both locales and sees the exact email; a forced SMTP failure retries then dead-letters **visibly**; every catalogued event that should notify, does.
  **Applies:** U0, U9, U24, U27, MS3, MS6, N5.

## P8.13 — `documents-service` I: the document engine

**Scope:** a **new service** owning templates, clauses, variables, versioning and rendering. Domain-agnostic — it knows nothing about contracts or proposals. Follows the `03-microservices-platform.md` recipe exactly (own DB + drizzle config + migrations, DDD layering, contracts in `libs/contracts`, Outbox, idempotent consumers, compose entry + dev Dockerfile + nginx route + Postman + `documents-service.md`).
**Tasks:**

- **Structured document model, not free HTML** — an ordered list of typed blocks: `heading | paragraph | list | table | definition | clause-ref | variable | signature-block | page-break`, each with ar/en translations (N5).
- **Clause library** — reusable, versioned, categorised clauses, each with ar/en text, variables, and a negotiability note.
- **Templates** — composed of clauses + blocks; **immutable once published**; an edit creates a new version; drafts preview and diff against the published version.
- **Variable catalog** — typed, namespaced (`entity.*`, `client.*`, `project.*`, `money.*`, `date.*`) with resolvers; an unknown variable **fails at save**, never at render.
- **Rendering** — one renderer producing HTML for screen and **PDF via headless Chromium in the service container**, Cairo / IBM Plex Sans Arabic embedded. Chromium is the only engine that shapes Arabic ligatures and RTL correctly (`@react-pdf/renderer` and `pdfmake` do not) — not negotiable for an Arabic-first product. Screen and PDF come from the **same** HTML so they cannot drift.
  **Done when:** a seeded template renders identically on screen and as a PDF in ar (RTL, **correct ligatures — opened and looked at**) and en; publishing freezes a version; an unknown variable is rejected at save; boot-verifier UP with the new service.
  **Applies:** U0, U3, N1–N7, MS1–MS3, MS5, DOC1, TDD1/TDD2, U26.

## P8.14 — `documents-service` II: e-signature

**Scope:** the signing machinery, built to stand up as evidence.
**Tasks:**

- `envelope` (document snapshot at issue), `signer` (role client-signatory / provider-signatory / witness / cc; sequential or parallel order), `envelope_event` (append-only).
- A real guarded **state machine**: `draft → sent → viewed → identity-verified → signed → completed`, plus `declined`, `expired`, `voided` — not a free-form status column.
- **Two complete access paths:** a signed, expiring, revocable, rate-limited **tokenized link** (for signers with no account), _and_ signing from inside the client portal.
- **Identity check** — OTP to email (default) or SMS/WhatsApp when configured; failed attempts throttled and recorded.
- **Signature capture** — drawn (canvas), typed (script face), or uploaded image; consent checkbox with the ETL-style disclosure; every capture stamped with ip, user-agent, timestamp, geolocation-if-granted.
- **Tamper evidence** — SHA-256 of the sealed PDF stored at completion; a **certificate of completion** page appended listing every envelope event, every signer, their verification method, and the hash.
- **Provider seam** — `capability: esignature → provider: {internal | <licensed CSP>} → active`, mirroring storage/email, so a DGA-licensed Saudi CSP is one adapter and zero UI change.
- Every transition emits a catalogued event and writes an audit row.
  **Done when:** a document is sent, opened via an unauthenticated tokenized link in a clean browser, OTP-verified, signed by two signers **in sequence**, and completed — producing a sealed PDF whose **stored hash matches the downloaded bytes**, with a certificate page listing the full trail; a voided link is dead; an expired link says so and offers a resend.
  **Applies:** U0, U23, U27, N13, MS2/MS3, DOC1, TDD1.

## P8.15 — `crm-service` I: clients, contacts, activities

**Scope:** a **new service** owning the commercial relationship. Same platform recipe as P8.13.
**Tasks:** `client` (company or individual, ar/en names, tax/registration where applicable, address, currency, preferred locale), `contact` (many per client, role, email, phone, is-primary), `activity` (call/email/meeting/note/file — append-only timeline), `task` (follow-up + due date + assignee + reminder), `pipeline_stage` + `deal`. **Lead → client conversion** consuming the existing `lead.created`, carrying the lead's whole history onto the client timeline; the lead status enum grows `qualified` and `converted` with guarded transitions; lead **assignment/ownership** so every inbound lead has a named human from minute one. Identity read via RMQ request/reply (MS2) — never an import, never its DB.
**Done when:** an inbound website lead is qualified, assigned, worked through a timeline and converted into a client with its history intact; the conversion emits `client.created`; verifier PASS.
**Applies:** U0, U27, MS1/MS2/MS3/MS5/MS6, N1–N7, DOC1.

## P8.16 — `crm-service` II: proposals / quotes

**Scope:** the document a client accepts before a contract exists.
**Tasks:** `proposal` (number from `libs/shared/sequence`, client, deal, validity window, currency, ar/en) + `proposal_line` (description, qty, unit price, discount, tax) with totals via `libs/shared/money`; optional **phased delivery** lines mapping onto the contract's payment schedule. Versioning (`v1`, `v2`… with a diff) and a real state machine `draft → sent → viewed → accepted | declined | expired | superseded`. Rendered through `documents-service` from a proposal template, **accepted online** via tokenized link or from the client portal, with the acceptance audited exactly like a signature. Emits `proposal.sent|viewed|accepted|declined|expired`; **expiry is a scheduled sweep**, not a lie told by a status column.
**Done when:** a proposal is built from line items, rendered in ar + en, sent, viewed, accepted online, and the acceptance audited; an expired proposal cannot be accepted **and says why**.
**Applies:** U0, U23, U27, MS2/MS3, N7, DOC1.

## P8.17 — `crm-service` III: contracts ← the headline feature

**Scope:** a contract system that makes a client feel they are dealing with a real company.
**Tasks:**

- **Two-layer model, the professional standard:** a standing **MSA** (IP assignment, confidentiality, liability cap, warranty, support, termination, governing law) plus per-project **SOW**s hanging off it; a single-document **combined** mode for small engagements. Template-driven, so the model is a **choice per client**, not a code path.
- `contract` (number, kind `msa | sow | combined | amendment`, parent link, client, effective/expiry, auto-renew + notice period, currency, status), `contract_party`, `contract_milestone` (deliverable, due trigger, acceptance criteria, amount), **`payment_schedule`** (deposit %, milestone amounts, net terms, late-fee clause — **first-class data**, so P10 invoicing reads it rather than re-deriving it), `contract_obligation` (what each side owes, with dates → feeds reminders).
- **Generated from an accepted proposal** — client, scope, milestones and money flow through; no retyping.
- **Approval workflow** before sending (configurable by value threshold / by kind).
- **Amendments & change orders** as first-class linked child contracts that **never mutate the signed parent**.
- **Renewal & expiry tracking** with lead-time reminders through notifications.
- Signed via `documents-service` (P8.14); the signed artifact is a **frozen snapshot** — the template may evolve afterwards and the executed contract never changes.
- Status machine `draft → pending-approval → approved → sent → partially-signed → executed`, plus `declined`, `expired`, `terminated`, `superseded`. Every transition audited and catalogued.
  **Done when:** an accepted proposal generates an MSA + SOW, routes for approval, is sent, is signed by both sides and lands `executed` with a sealed PDF and a complete audit trail; an amendment supersedes a clause **without touching** the parent's signed artifact; a renewal reminder fires.
  **Applies:** U0, U23, U27, MS2/MS3/MS6, N1–N7, DOC1, TDD1.

## P8.18 — The default contract template pack

**Scope:** the generic, jurisdiction-neutral, **editable** templates seeded on first boot — the thing the owner asked for by name. Seeded as published `v1`, fully editable in the admin, composed from the clause library so a clause fixed once is fixed everywhere.
**Tasks:**

- **MSA** — parties (rendering correctly in `individual` party mode), definitions, engagement structure, fees & payment terms, taxes (rendered **only** when a tax rate is configured), IP ownership & assignment **on full payment**, licence-back of background/pre-existing IP, third-party & open-source components, confidentiality & NDA, data protection & processing, warranties + duration, disclaimer, liability cap, indemnity, non-solicitation, term & termination (for cause / for convenience / effect), force majeure, assignment, notices, entire agreement, governing law & dispute resolution (courts **or** arbitration, from settings), counterparts & electronic-signature acknowledgement.
- **SOW** — scope & deliverables, out-of-scope, phase/milestone table, acceptance testing & **deemed-acceptance window**, change-control procedure, client responsibilities & dependencies, assumptions, timeline, price & payment schedule, support & warranty period, post-delivery support terms.
- **Change order**, **NDA (mutual + one-way)**, **maintenance/support agreement**, **proposal template**.
- Every template ar + en with key parity; **Arabic is the governing text by default**, and that default is itself a setting. Clause variables resolve from the Legal Entity Profile (P8.9) — which is what makes the pack reusable by another agency that buys this platform.
  **Done when:** a **fresh install** renders a complete, coherent, legally-structured MSA + SOW in ar and en with **zero** company-specific text hardcoded; editing a library clause updates every **draft** template that references it and **no executed contract**; verifier PASS.
  **Applies:** U0, U3, U8, U9, N5, DOC1.

## P8.19 — Admin: CRM surfaces

**Scope:** clients, contacts, pipeline board, the lead inbox **rebuilt** (assignment, qualification, activity timeline, follow-up tasks, conversion), activity feed, reminders. Reuses the existing `data-table`, `dynamic-form`, `modal`, `server-select`, `media-explorer` kit (F9 — reuse before create). Every state per U0/U23; ar-RTL + en-LTR, dark + light, phone/tablet/desktop.
**Done when:** an admin runs an inbound lead from arrival to converted client **entirely in the UI**, and every mutation publishes its catalogued `EVENT_BUS` event with a subscriber that reacts (U27); verified by looking in both locales and both themes.
**Applies:** U0, U21, U23, U27, F1–F13, W1–W6.

## P8.20 — Admin: proposals, contracts, and the template/clause editor

**Scope:** proposal builder (line items, live totals, preview), contract builder from a proposal, approval queue, signature tracking with a live envelope timeline, amendments, renewal calendar — and the **structured clause/template editor**: block-level editing, clause picker, variable insertion with autocomplete against the typed catalog, per-locale tabs, version diff, publish. Explicitly **not** a JSON textarea (U0).
**Done when:** a full lead→client→proposal→contract→signed cycle is driven end-to-end from the admin UI and **verified by looking**, in both locales and both themes.
**Applies:** U0, U21, U23, U27, F1–F13, W1–W6, DOC1.

## P8.21 — `apps/client-portal` I: foundation

**Scope:** the new React+Vite app, built to **W7** — the `bishola-app-v2`/`TRIPPRO_DASHBOARD` tree, **not** the admin portal's. Canon: `docs/plans/09-client-portal.md`.
**Tasks:** typed `EVENT_BUS` + `apiRegistry` + `modalRegistry` + `storeFactory` (**wired**, not dead) + `renderWithProviders` harness + per-module i18n merged at `app.config.tsx` + tokens/theme dark+light + RTL-first + route guards that gate on **permission** (not just the menu) + per-route `lazy()` + real error boundaries + one `baseQueryWithAuth` doing envelope unwrap, refresh-with-mutex, and a single `applyServerErrors` helper. Client auth: invitation → verify → set password → login, plus the tokenized-signer path from P8.14.
**Done when:** the shell boots in ar and en, dark and light, at all three widths; the **ESLint boundary probe is green both ways** (a deliberate `shared/ → modules/` import MUST fail, then be removed); every foundation unit is specced in its own concept folder (U26).
**Applies:** U0, U5, U6, U7, U8, U26, U27, W7, F1–F13, TDD1.

## P8.22 — `apps/client-portal` II: the client's surfaces

**Scope:** dashboard · my proposals (review + accept/decline online) · my contracts (review + sign + download the sealed PDF + see the audit trail) · documents · project phase status (read-only, from what exists today) · messages/announcements · profile & notification preferences. Every state, every width, both directions, both themes.
**Done when:** a real client, invited by email, sets a password, reviews a proposal, accepts it, signs the resulting contract and downloads the sealed PDF — **verified by driving the running app**, not by tests alone.
**Applies:** U0, U21, U23, U27, W7, F1–F13.

## P8.23 — Website go-live pack

**Scope:** the last things between the site and a paid ad click.
**Tasks:** phone field + a configurable **WhatsApp CTA** on contact and request-a-project; thank-you states that fire **conversion events**; a GA4/GTM + Meta/Snap/TikTok pixel layer driven **entirely from settings** (no hardcoded IDs — the platform is sellable) with **consent-mode gating**; a real cookie/consent banner and genuine **privacy notice, terms, and data-processing** pages rendered from the CMS (required before running ads that collect personal data); per-page SEO/OG re-verified; sitemap + robots re-checked against the new routes; a client-portal entry point in the site chrome.
**Done when:** a lead submission from an ad click produces a **tracked conversion with consent respected**, and every legal page renders from the CMS in ar + en.
**Applies:** U0, U9, WEB1–WEB6, F7, U8.

---

## P9 — End-to-end verify + DEPLOY (staging → production) ← priority milestone

**Scope:** ship website + admin to real environments.
**Tasks:**

- `infra/docker-compose.staging.yml` + `infra/docker-compose.prod.yml`; production multi-stage Dockerfiles; nginx + **acme SSL**; per-service prod DBs.
- Scripts (port from bishola-deployment-v2): `deploy.sh` (migrate→build→health→rollover), `backup_db.sh` (+ R2 push), `renew.sh`, `health_check.sh`, `monitor.sh`, `validate_env.sh`.
- Deploy website + admin + their services to **staging**, smoke-test, then **production**.
  **Done when:** website + admin run on staging **and** production with green health checks, valid SSL, and a successful DB backup (optionally pushed to R2); verifier PASS.
  **Applies:** `05-deployment.md`; rules OPS1–OPS4, MS8.

---

## P8.6 — Currency & budget bands → configurable — **ABSORBED INTO P8.9 (2026-08-08)**

> **Do not build this separately.** Contracts and proposals need configurable money anyway, so doing it
> twice would be the exact duplication U3 forbids. The full scope below is carried verbatim into **P8.9
> — Legal Entity Profile + configurable money**, where currency, symbol, placement, tax rate and tax
> label live beside the rest of the company's configurable identity. Kept here for the "why" and for the
> lead-band migration constraint, which still binds.

**Why:** the request-a-project budget bands + the `SAR` currency are frozen in code
(`apps/website/src/components/marketing/request/request.constants.ts:32-35`), and those exact
display strings are **persisted onto every lead record** — so renaming a band silently breaks the
comparability of historical leads. Owner directive (2026-07-19): _"currency has effect in a lot of
places, so yes we need to make it editable — but not this session; do it fully and correctly
without missing anything."_
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
