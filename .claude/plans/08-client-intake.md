# 08 — Client intake: clients, proposals, contracts, e-signature

> The deep plan behind `02-mvp.md` **P8.7 → P8.20**. Domain model, state machines, event catalog and the
> clause/template specification. Read this before building any of those phases.
>
> **U0 governs every line of this document.** Nothing here ships "simply". A phase that cannot be built to
> the bar in one pass is **split in `PROGRESS.md`** — that is expected, not a failure.

---

## 1. Why this exists (the 2026-08-08 audit)

The owner deploys and **immediately runs paid ads**. Read from the code, not inferred:

| Gap | Evidence |
|---|---|
| No contracts / proposals / e-sign / documents — at all | Zero tables, zero message patterns, zero routes across all six services and `libs/contracts`. |
| No client entity | `CLIENT_ROLE` exists in `libs/contracts/src/lib/identity/role.ts` but is seeded `[]` in `apps/identity-service/src/seed/seed-data.ts` — a label, nothing more. No `client` table anywhere. |
| A lead is a dead end | `apps/content-service/src/db/schema/lead.table.ts`: `name, email, company, budget, projectType, message, source, locale, status`. **No phone.** `leadStatusEnum = ['new','contacted','archived']`, set free-form with no guards. No owner, notes, activity, follow-up, dedup, or conversion. The admin module is a table + a status dropdown. |
| `POST /api/leads` public and unprotected | `apps/api-gateway/src/content/leads.controller.ts` — no `ThrottlerModule`, `helmet`, CORS policy, captcha or honeypot exist anywhere in `apps/api-gateway/src`. |
| No password reset / email verification / login lockout | Explicitly out of scope in `libs/contracts/src/lib/identity/user-update.zod.types.ts`. |
| A failed email stays failed forever | notifications-service has no retry sweeper; `email_status` goes `pending → failed` and stops. |
| No audit log, no PDF, no sequential numbering | Only `updated_by_user_id` on three integration tables. All IDs are `uuid`. |
| Two orphan events | `settings.changed` and `user.registered` are emitted with **no consumer** — the first finding U27 will formalise. |

### Owner decisions (2026-08-08 — do not relitigate)

1. **E-signature in-house**, behind the existing `capability → provider → active` seam (the same shape as
   storage/email in `libs/contracts/src/lib/settings/integration-catalog.ts`), so a DGA-licensed Saudi CSP
   becomes one adapter and zero UI change.
2. **Pre-deploy commercial scope = clients + proposals + contracts.** Invoicing/payments are P10; the
   contract still carries a first-class **payment schedule** so nothing is half-built.
3. **Client portal built now** (see `09-client-portal.md`).
4. **No legal entity registered yet** — possibly Syria, possibly Saudi, possibly elsewhere — and the
   platform may be **sold to other tech companies**. Nothing about the company, its jurisdiction, its
   currency or its tax is hardcoded.

### The legal position, stated once

A contract binds **named parties**, not templates — a generic, country-neutral template is entirely legal
and is how every CLM product works. What is *not* neutral is the signatory: **with no registered entity,
the owner personally is the contracting party and personally liable**, and naming a company that does not
exist would be a misrepresentation. Hence `partyMode` defaults to **`individual`**: the template renders a
correct, honest agreement signed by a named individual trading under a brand. Switching to `company` later
— adding a registration number, tax number, jurisdiction — is a settings change, not a rebuild. That same
indirection is exactly what makes the platform sellable to another agency.

Research basis: MSA + SOW is the professional two-layer standard; the CLM layer around it is clause
library, versioned templates with merge variables, approval workflow, e-signature, tamper-evident audit
trail, amendments/change orders, renewal tracking. Saudi ETL (Royal Decree M/18, Implementing Regulation
of 13 March 2024) makes e-signatures binding where the signature is uniquely linked to the signatory,
under their control, and evidenced — the licensed-CSP certificate tier is a stronger evidentiary class we
keep reachable through the provider seam rather than blocking on.

---

## 2. Service boundaries

Two new services. **No service imports another** (MS1); cross-service reads are RMQ request/reply (MS2),
writes are events + Outbox with idempotent consumers (MS3, MS6); each owns its own DB (MS5).

| Service | Owns | Does NOT own |
|---|---|---|
| **`documents-service`** | The *generic* document machinery: clause library, templates + versions, the variable catalog, rendering (HTML + PDF), signature envelopes, signers, envelope events. Domain-agnostic — it has never heard of a "contract". | Any commercial meaning. It does not know what a proposal or a contract is. |
| **`crm-service`** | The *commercial relationship*: client, contact, activity, task, pipeline stage, deal, proposal, contract, milestones, payment schedule, obligations. | Rendering, PDFs, signatures — it asks `documents-service`. |

This split is why `documents-service` is built **first**: proposals and contracts are both "a document
built from a template, sent to a party, accepted or signed". Building the engine twice is the duplication
U3 forbids. It also matches `00-full-system.md`, which already lists `documents` (storage + e-signature
with signer roles + audit trail) and `crm` (proposals/quotes, sales contracts) as separate services.

Both follow the `03-microservices-platform.md` recipe exactly: own DB + drizzle config + migrations, DDD
layering (presentation/application/domain/infrastructure), contracts in `libs/contracts`, Outbox relay,
idempotent consumers, a `docker-compose.dev.yml` entry, a dev Dockerfile, an nginx route, Postman entries,
and a colocated `<service>.md` (DOC1). U26 governs every leaf: a logic unit is a folder holding its source
and its spec.

---

## 3. `documents-service` — the document engine (P8.13)

### 3.1 The structured document model

**A document is not HTML.** It is an ordered list of typed blocks, because U0 forbids handing a structured
domain a blob and a shrug — and because a blob cannot be diffed, clause-linked, or variable-validated.

```
block kinds: heading | paragraph | list | table | definition
             | clause-ref | variable | signature-block | page-break
```

Every block carries ar/en translations in a `*_translations` table (N5) — never two languages in one row.

**Tables**

| Table | Purpose |
|---|---|
| `clause` + `clause_translation` | The reusable library: category, key, ar/en body, variables used, negotiability note, version. |
| `document_template` + `_translation` | Named template (`msa`, `sow`, `combined`, `change-order`, `nda-mutual`, `nda-oneway`, `maintenance`, `proposal`), kind, status. |
| `template_version` | **Immutable once published.** Holds the ordered block list. An edit creates the next version; a draft can diff against the published one. |
| `template_block` | One row per block: order, kind, payload, optional `clause_id` for a `clause-ref`. |
| `rendered_document` | A resolved snapshot: template version + resolved variable values + the produced HTML + PDF media reference + content hash. |
| `outbox` | MS3. |

### 3.2 The variable catalog

Typed and **namespaced**, each with a resolver:

- `entity.*` — from the Legal Entity Profile (P8.9): legal name, party mode, registration/tax numbers,
  address, jurisdiction, governing law, dispute forum, signatory name/title.
- `client.*` — from crm-service via RMQ request/reply.
- `project.*` — scope, deliverables, milestones, dates.
- `money.*` — amounts, currency, tax rate/label, totals, payment schedule (via `libs/shared/money`).
- `date.*` — effective, expiry, execution (via `DateTimeService`, N3 — never `new Date()`).

**A template referencing an unknown variable fails validation at SAVE, never at render.** A document that
renders `{{client.name}}` literally in front of a client is the failure mode this prevents.

### 3.3 Rendering — and why headless Chromium

One renderer produces the HTML shown on screen **and** the HTML fed to the PDF, so the two cannot drift.

PDF generation runs **headless Chromium inside the `documents-service` container**, with Cairo and IBM
Plex Sans Arabic embedded in the image. This is a decision, not a preference: **`@react-pdf/renderer` and
`pdfmake` do not shape Arabic** — they render unjoined, unligatured glyph soup and mangle bidi. For an
Arabic-first product whose contracts are governed by their Arabic text, Chromium is the only correct
engine. The container gains a Chromium layer and a font layer; that cost is accepted.

**Verification is by eye, not by test:** a green test proves bytes were produced, not that a glyph joined.
P8.13 is not done until the seeded MSA PDF is *opened and looked at* in Arabic.

---

## 4. `documents-service` — e-signature (P8.14)

### 4.1 Model

`envelope` (the frozen document snapshot at issue) → `signer` (many) → `envelope_event` (append-only).

Signer roles: `client-signatory`, `provider-signatory`, `witness`, `cc`. Order: sequential or parallel.

### 4.2 State machine — guarded, not a free-form column

```
draft ──send──▶ sent ──open──▶ viewed ──otp ok──▶ identity-verified ──sign──▶ signed ──all signers──▶ completed
  │               │              │                       │                      │
  └──▶ voided     ├──▶ declined  ├──▶ declined           ├──▶ declined          └──▶ (next signer, if sequential)
                  └──▶ expired   └──▶ expired            └──▶ expired
```

Illegal transitions are rejected at the domain layer with a localized key (U24), never silently ignored.

### 4.3 Two complete access paths

1. **Tokenized signing link** — a signed, expiring, revocable, rate-limited token for signers with no
   account (the second signatory at the client's company). No login. This is the industry-standard flow.
2. **In-portal signing** — the invited client signs from `apps/client-portal`.

Both are built. Neither is the "lite" version of the other.

### 4.4 Identity, capture, evidence

- **Identity check** — OTP delivered to the signer's email (the coded default, so nothing blocks on a
  provider account) or SMS/WhatsApp when configured. Failed attempts throttled and recorded.
- **Signature capture** — drawn on canvas, typed in a script face, or an uploaded image; a consent
  checkbox carrying the electronic-signature disclosure; every capture stamped with ip, user-agent,
  timestamp, and geolocation if the browser grants it.
- **Tamper evidence** — SHA-256 of the sealed PDF stored at completion, plus a **certificate of
  completion** page appended to the PDF listing every envelope event, every signer, each signer's
  verification method, and the document hash.
- **Audit** — every transition writes a `libs/shared/audit` row *and* emits a catalogued event.

### 4.5 Provider seam

`capability: esignature → provider: { internal | <licensed CSP> } → active`, mirroring storage and email
exactly. Swapping to a DGA-licensed CSP is one adapter and **zero UI change** — the reason this shape was
chosen over integrating a vendor now.

---

## 5. `crm-service` (P8.15–P8.17)

### 5.1 Clients, contacts, activities (P8.15)

`client` (company or individual, ar/en names, tax/registration where applicable, address, currency,
preferred locale) · `contact` (many per client; role, email, phone, is-primary) · `activity` (call, email,
meeting, note, file — **append-only** timeline) · `task` (follow-up, due date, assignee, reminder) ·
`pipeline_stage` + `deal`.

**Lead → client conversion** consumes the existing `lead.created` (already emitted via Outbox by
content-service) and carries the lead's entire history onto the client's timeline. The lead status enum
grows `qualified` and `converted`, with guarded transitions replacing today's free-form set. Lead
**assignment/ownership** lands here too — an inbound lead must have a named human responsible from minute
one, or the ads are buying nothing.

### 5.2 Proposals (P8.16)

`proposal` (number from `libs/shared/sequence`, client, deal, validity window, currency, ar/en) +
`proposal_line` (description, quantity, unit price, discount, tax), totals via `libs/shared/money`.
Optional **phased delivery** lines map onto the contract's payment schedule, so accepting a proposal
produces a contract without retyping anything.

```
draft ──▶ sent ──▶ viewed ──▶ accepted
             │        │  └──▶ declined
             │        └─────▶ expired
             └──────────────▶ superseded (by v2)
```

Versioned with a diff. Rendered through `documents-service`. **Accepted online** — tokenized link or the
portal — with the acceptance audited exactly like a signature. **Expiry is a scheduled sweep**, not a lie
told by a status column that nobody updates.

### 5.3 Contracts (P8.17) — the headline

**Two-layer model.** A standing **MSA** (IP assignment, confidentiality, liability cap, warranty, support,
termination, governing law) plus per-project **SOW**s hanging off it, with a single-document **combined**
mode for small engagements. All three are templates, so the model is a **choice per client**, not a code
path.

**Tables:** `contract` (number, kind `msa|sow|combined|amendment`, parent link, client, effective/expiry,
auto-renew + notice period, currency, status) · `contract_party` · `contract_milestone` (deliverable, due
trigger, acceptance criteria, amount) · **`payment_schedule`** (deposit %, milestone amounts, net terms,
late-fee clause) · `contract_obligation` (what each side owes, with dates → feeds reminders).

`payment_schedule` is **first-class data on purpose**: P10's invoicing reads it rather than re-deriving
it, which is what keeps "invoicing comes later" from meaning "the contract is half-built".

```
draft ──▶ pending-approval ──▶ approved ──▶ sent ──▶ partially-signed ──▶ executed
                                                                            │
   ├──▶ declined   ├──▶ expired   ├──▶ terminated   └──▶ superseded ◀───────┘ (by an amendment)
```

- **Generated from an accepted proposal** — client, scope, milestones and money flow through.
- **Approval workflow** before sending, configurable by value threshold or by contract kind.
- **Amendments & change orders** are first-class **linked child contracts**. They never mutate the signed
  parent — the executed artifact is immutable evidence.
- **Renewal & expiry** tracked with lead-time reminders through notifications.
- The signed artifact is a **frozen snapshot**: the template may evolve afterwards and an executed
  contract never changes.

---

## 6. The default template pack (P8.18)

Seeded as published `v1`, **fully editable**, composed from the clause library so a clause fixed once is
fixed everywhere. Every template ar + en with key parity; **Arabic is the governing text by default**, and
that default is itself a setting.

**MSA** — parties (correct in `individual` party mode) · definitions · engagement structure · fees &
payment terms · taxes (**rendered only when a tax rate is configured**) · IP ownership & assignment **on
full payment** · licence-back of background/pre-existing IP · third-party & open-source components ·
confidentiality & NDA · data protection & processing · warranties + duration · disclaimer · liability cap
· indemnity · non-solicitation · term & termination (for cause / for convenience / effect) · force majeure
· assignment · notices · entire agreement · governing law & dispute resolution (courts **or** arbitration,
from settings) · counterparts & electronic-signature acknowledgement.

**SOW** — scope & deliverables · out-of-scope · phase/milestone table · acceptance testing & **deemed-
acceptance window** · change-control procedure · client responsibilities & dependencies · assumptions ·
timeline · price & payment schedule · support & warranty period · post-delivery support terms.

**Also seeded:** change order · NDA (mutual + one-way) · maintenance/support agreement · proposal template.

**The neutrality test for P8.18:** a *fresh install* must render a complete, coherent MSA + SOW in ar and
en with **zero** company-specific text hardcoded. Every party fact resolves from the Legal Entity Profile.
That is what makes the pack reusable by another agency that buys this platform — and it is checkable, so
the verifier checks it.

---

## 7. The event catalog (U27)

`libs/contracts/src/lib/events/` — one `<event>.event.ts` per event plus a registry mapping
`name → { payloadSchema, producer, consumers[] }`. Backend **and** frontend events live in the same
catalog. An event with zero consumers must carry an explicit `consumers: []` **and a stated reason**, so an
orphan is a deliberate, reviewable choice rather than an accident.

**Backfilled in P8.7 (existing today):** `lead.created` (content → notifications) · `media.deleted` (media
→ content) · `settings.changed` (settings → **nobody — orphan**) · `user.registered` (identity → **nobody
— orphan**) · the admin portal's client-bus events.

**Added by this block:**

| Event | Producer | Consumers |
|---|---|---|
| `lead.assigned`, `lead.qualified`, `lead.converted` | crm | notifications, admin bus |
| `client.created`, `client.updated` | crm | notifications, documents (variable cache), admin bus |
| `proposal.sent/viewed/accepted/declined/expired` | crm | notifications, admin bus, client-portal bus |
| `contract.sent/approved/signed/executed/expiring/terminated` | crm | notifications, admin bus, client-portal bus |
| `envelope.sent/viewed/identity-verified/signed/completed/declined/voided/expired` | documents | crm, notifications, audit |
| `document.rendered`, `template.published` | documents | crm, admin bus |
| `user.invited/verified`, `password.reset.requested`, `login.failed/locked` | identity | notifications, audit |

**The discipline U27 actually adds:** before writing any new action, audit this table for events that
action should *react* to. A feature that only emits, or only listens, is half-wired.

---

## 8. Build order and why it is this order

```
P8.7  law + event catalog          ← everything after is checked against it
P8.8  audit · sequence · money     ← e-sign evidence + document numbering need these first
P8.9  legal entity + money config  ← templates resolve their party facts from here
P8.10 gateway hardening            ← independent; must land before ads regardless
P8.11 identity completion          ← client invitations depend on it
P8.12 notifications completion     ← every later phase sends something
P8.13 documents I  (engine)        ← proposals AND contracts both render through it
P8.14 documents II (e-sign)        ← needs the engine + audit
P8.15 crm I   (clients)            ← consumes lead.created
P8.16 crm II  (proposals)          ← needs documents + sequence + money
P8.17 crm III (contracts)          ← generated from an accepted proposal
P8.18 template pack                ← needs the clause library + the entity profile
P8.19 admin CRM surfaces           ← needs crm I
P8.20 admin proposals/contracts    ← needs crm II+III and the template pack
P8.21 client-portal foundation     ← see 09-client-portal.md
P8.22 client-portal surfaces       ← needs everything above
P8.23 website go-live pack         ← independent; last because it is the ad-facing skin
P9    deploy
```

Audit and sequence precede e-signature deliberately: a signature with no audit trail is not evidence, and
retrofitting an audit log onto signed documents means the earliest contracts have the weakest record.

---

## 9. Verification beyond the standard gates

Every phase runs `verifier` → PASS, `boot-verifier` → UP, then verified-by-looking (U0/U21e) in ar and en,
dark and light, at phone/tablet/desktop, asserting `scrollWidth === clientWidth` and zero page errors.
These phases each need one extra, specific proof:

- **P8.8 sequence** — allocate from concurrent workers; assert no gaps, no duplicates.
- **P8.10 throttling** — flood the public lead endpoint; assert legitimate submissions still land.
- **P8.13 PDF/Arabic** — render the seeded MSA and **open it**: ligatures joined, RTL correct, fonts
  embedded, page breaks sane. A green test does not prove a glyph.
- **P8.14 e-signature** — complete a real two-signer envelope through a tokenized link in a clean browser;
  verify the stored SHA-256 matches the downloaded PDF **byte for byte**; verify a voided link is dead and
  an expired one says so.
- **P8.18 neutrality** — render a fresh install's MSA and grep the output for company-specific strings;
  the count must be zero.
- **U27, every phase** — prove the check works: add an un-catalogued event, see the verifier go red,
  remove it.

---

## 10. Explicitly out of scope here

- **Invoicing, payments, ZATCA e-invoicing** — P10. With no registered entity there is nothing to invoice
  under. The payment schedule (P8.17) and the sequence lib (P8.8) are built so P10 reads them rather than
  re-deriving them; ZATCA Phase-2 (UBL 2.1 XML, QR, Fatoora clearance) becomes its own phase when an
  entity is registered and VAT-registered.
- **Realigning `apps/admin-portal` to the `W7` tree.** The owner's instruction was that the *client
  portal* must not be built the way the admin portal was. The admin portal is ~480 green tests of working
  product; migrating it is a real, separate, post-deploy phase — recorded here rather than silently
  ignored or silently done.
- **Projects/phases/tasks, HR, finance, support, AI assistant** — P10+ as already planned in
  `00-full-system.md`.
