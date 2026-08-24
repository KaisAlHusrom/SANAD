# settings-service

> The Sanad Tech configuration engine + branding (P3). Resolves every configurable
> value **override → global → coded default** (U9), caches in Redis, and answers the
> gateway over RabbitMQ.

## Purpose

The reusable settings engine that makes the product 100% DB-driven without ever
rendering blank (F7). Owns the setting **catalog** (descriptors), **scope-keyed values**,
and **translations**. Its first concrete group is **branding** (the website's colors,
logo, fonts, social, contact). Reads are cached; a write emits `settings.changed` so
caches elsewhere (the P8 website) can revalidate. Never faces the public internet (MS4).

## Toolchain

NestJS 11, ESM + SWC (N11), **hybrid app**: an HTTP `/health` endpoint + an RMQ
microservice consuming `settings.commands`. Own database (MS5) via Drizzle; migrations
in `src/db/migrations` (generate → migrate, never push). Redis cache via `@sanad/cache`.

## Entities (own DB — `settings` / `settings_test`)

| Table                 | Notes                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setting`             | catalog/descriptor: `key` (unique), `group`, `type`, `requirement`, `scope`, `options`, `default_value`; soft-delete                                       |
| `setting_value`       | scope-keyed value: `scope` (global/client) + `scope_id`; `value` jsonb (NULL for localized); two **partial unique** indexes (one global, one per scope+id) |
| `setting_translation` | per-locale text for `localized_text` values (N5); composite PK `(setting_value_id, locale)`                                                                |
| `outbox`              | transactional Outbox (MS3), shared table from `@sanad/messaging`                                                                                           |

## Resolution (U9 / F7)

`SettingsResolver` resolves a key (or whole group) with precedence **client override →
global → coded default** (`SETTINGS_DEFAULTS`, `application/settings-defaults/` — the merge of
every group's coded defaults; it lived inside `branding-catalog.ts` while branding was the only
group, and moved out in P8.10.A so one group's catalog is not quietly authoritative for all). `localized_text` values assemble
`{ar, en}` with **per-locale** fallback to the coded default, so a partial translation
never renders a blank locale. The **branding assembler** deep-merges resolved values over
`BRANDING_DEFAULTS`, guaranteeing every leaf is present. Override scope (`client`) is
wired but dormant in MVP — only `global` is populated until the client portal exists.

The coded defaults compose from the locked design tokens (`@sanad/config`:
`websiteTokens`, `pageAccents`, `fonts`) + the bilingual brand copy
(`docs/design/content-defaults.md`). `BRANDING_FIELDS` is the single source driving
seeding, default flattening, group assembly, and update flattening.

## Cache (MS2 / F7)

Resolved global branding is cached in Redis under a **version key**
(`settings:branding:version`) + a versioned data key (`settings:branding:v{N}:global`,
TTL 1h). A write `incr`s the version, so the next read recomputes — no delete races, no
stale reads. The version bump handles this service's own cache; the `settings.changed`
event handles every other cache (MS3).

## Contracts (`@sanad/contracts/settings`)

`settingTypeSchema`/`SettingType`, `settingScopeSchema`, `resolveScopeSchema`,
`BrandingRecord` (+ sub-types), `resolveRequestSchema`, `resolveGroupRequestSchema`,
`brandingUpdateRequestSchema` (deep-partial, `.strict()`), `SETTINGS_PERMISSIONS`, and the
message-pattern constants.

## Message patterns (MS2 — request/reply)

| Pattern                    | Payload                                           | Reply                |
| -------------------------- | ------------------------------------------------- | -------------------- |
| `settings.branding.get`    | `ResolveScope`                                    | `BrandingRecord`     |
| `settings.branding.update` | `BrandingUpdateRequest` (+ identity headers, MS4) | `BrandingRecord`     |
| `settings.resolve`         | `ResolveRequest`                                  | resolved value       |
| `settings.group.resolve`   | `ResolveGroupRequest`                             | `Record<key, value>` |

## Integration-secrets vault (N13)

Integrations patterns (MS2):

| Pattern                          | Payload                                         | Reply                             |
| -------------------------------- | ----------------------------------------------- | --------------------------------- |
| `settings.integration.status`    | `{}`                                            | `IntegrationCapabilityStatus[]`   |
| `settings.integration.configure` | `{ capability, provider, values }` (+ identity) | refreshed status                  |
| `settings.integration.activate`  | `{ capability, provider }` (+ identity)         | refreshed status                  |
| `settings.integration.resolve`   | `{ capability, provider? }` (**internal only**) | `ResolvedIntegrationConfig\|null` |

### The integrations vault (N13, reworked 2026-07-19)

The model is **capability → many provider configs → one active** (the driver/disk pattern), driven
entirely by `INTEGRATION_CATALOG` in `@sanad/contracts`. It replaces the flat `integration_secret`
table (one row per global credential key), which could not express "R2's bucket" vs "S3's bucket".

- **`integration_config`** — one row per `(capability, provider, field_key)`, partial-unique on the
  live rows. Per the field's descriptor: **secret** fields are AES-256-GCM encrypted into
  `ciphertext`/`iv`/`auth_tag` (`hidden`, N2) with `last4` for masked recognition; **non-secret**
  fields (bucket, endpoint, host…) are plaintext in `value` so the owner can see and edit them.
- **`integration_active_provider`** — one row per capability (unique index), so two providers can
  never be active at once.
- **`IntegrationsService`** — `getStatuses()` (masked, batch-read: no per-key N+1),
  `configureProvider()` (a field ABSENT from `values` is left untouched — how a masked secret
  survives an edit; `''` clears it), `activateProvider()`, and `resolveConfig()` whose decrypted
  plaintext crosses only the internal resolve reply, never a client.
- **Migration `0002`** created both tables and **backfilled** the two live flat rows
  (`SMTP_PASSWORD → email/smtp/password`, `R2_SECRET_KEY → storage/r2/secretAccessKey`) carrying
  the ciphertext verbatim — same key, no re-encryption, no value lost. `integration_secret` is
  retained (unused) for rollback safety and can be dropped in a later migration.

**Env fallback lives in the CONSUMER,** not here: media/notifications merge each field
**vault → their own env → missing** using the descriptor's `envVar` (U19 keeps each service's env
its own). So `getStatuses()` reports the vault only — an env-only deploy reads "not configured"
while still working, and "Test connection" is what proves the effective config.

**Per-capability RBAC (N13):** the gateway gates writes per capability, not under blanket
`settings.manage`. `integrationManagePermission(capability)` →
`settings.integrations.<capability>.manage`; viewing the masked page needs
`settings.integrations.read`. The gateway's `IntegrationPermissionGuard` resolves the
`:capability` route param and enforces it (admin's global `manage` covers all). These keys are
derived from the catalog and seeded into the identity RBAC catalog.

**Testing a provider is NOT done here (MS1):** the gateway routes
`POST /api/integrations/:capability/:provider/test` to the service that owns the adapter
(storage → media-service `media.storage.test`, email → notifications `notification.email.test`),
so settings-service never learns S3 or SMTP.

## Events emitted (MS3 — Outbox)

| Event              | Payload                                                    | Consumers                                           |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| `settings.changed` | `settingsChangedEventSchema` — `{ group, scope, scopeId }` | **none — declared orphan, P8.12 owns the consumer** |

Since P8.7 the payload is a real `.strict()` Zod contract in `@sanad/contracts`
(`settings/settings-event.zod.types.ts`), not an inline literal, and it carries **`scopeId`** —
without it a consumer could only drop _every_ cached scope instead of the one that moved. The event
is declared in the `EVENT_CATALOG` with an explicit `consumers: []` **plus a stated reason** (U27d):
notifications-service (P8.12) caches the branding + template snapshot it renders mail from and must
drop it on a `branding`/`notifications` change; the website ISR revalidation hook is P8.23.

## Gateway surface

`GET /api/branding` (**public** — website renders unauthenticated; returns coded
defaults when unset) and `PUT /api/branding` (guarded `settings.manage`, MS4).

## Generic settings catalog + writer (2026-06-27)

The descriptor catalog is now surfaced generically for the admin settings page:

- **`SETTING_DESCRIPTORS`** (`application/settings-catalog.descriptors.ts`) — the UI catalog
  (group → section → key → type/requirement/options), derived from each group's field list + a
  section map. Structure source of truth.
  **Filtered to `EDITABLE_SETTING_KEYS`** (2026-07-19): the catalog exposes only settings that
  **actually take effect somewhere**, in six sections — `identity` (`brand.name`, `brand.tagline`,
  `logoUrl`, `faviconUrl`), `colors` (`primary`/`secondary` → the **portal** accent, live),
  `contact`, `social`, `legal` (`copyright`) and `seo` (`siteUrl`, `shareImageUrl`). The website
  renders the contact/social/legal/seo leaves (both footers, OG/canonical, `sitemap.xml`,
  `robots.txt`, Organization JSON-LD); the portal renders identity + colors.
  **Excluded** because nothing consumes them (they would be dead controls): `colors.pageAccents.*`
  (per-page website color lives in the CMS pages settings), `colors.surface.*`/`colors.text.*` (the
  website's fixed art direction), `fonts.*` (no runtime font-by-name swap), `brand.shortDesc`.
  Those stay in `BRANDING_FIELDS`/`BRANDING_DEFAULTS`/`assembleBranding` so `GET /branding` is
  unchanged. Guarded by `settings-catalog.descriptors.spec.ts`.
- **New leaves (2026-07-19):** `branding.legal.copyright` (`localized_text`, defaulted from the
  website's footer dictionary so nothing changes visually until edited) and `branding.seo.siteUrl` /
  `branding.seo.shareImageUrl`. Added to the contract `BrandingRecord`, `BRANDING_DEFAULTS`,
  `BRANDING_FIELDS` (so `SETTINGS_CATALOG` seeds them automatically) and the
  `brandingUpdateRequestSchema` + `branding-update.flatten.ts` deep-partial write path. The
  copyright deliberately holds only the notice — the brand name is composed in at render time, so
  renaming the company updates every footer instead of stranding a baked-in name.
- **`SettingsCatalogService`** (`SETTINGS_CATALOG_GET`) — assembles `SettingsCatalog` (groups →
  sections → fields with descriptor + **resolved** value via `SettingsResolver.resolveGroup`,
  coded default when unset, F7). Read-only.
- **Clearing a value (2026-07-19 fix).** `assertValidSettingValue` accepts `null` for **every**
  nullable leaf — including `localized_text` (`contact.address` is `LocalizedText | null`). It used
  to reject null there, so emptying that field 500'd. When a `localized_text` is cleared the writer
  now also **deletes its `setting_translation` rows** (`SettingTranslationRepository.deleteForValue`,
  same transaction) — otherwise the resolver re-assembles the stale per-locale text over the cleared
  value instead of falling through to the coded default (U9). Covered by
  `settings-value.validate.spec.ts` + a `settings-db.int.spec.ts` clear→re-resolve case.
- **`SettingsWriter`** (`SETTINGS_SET`) — the single generic value-write seam (U3): validates
  each value against its descriptor `type` (`settings-value.validate.ts`, N7), then persists
  values (+ per-locale translations for `localized_text`) and one `settings.changed` Outbox
  event per touched group in ONE transaction via the **`TransactionRunner`** (N14 — no
  `DRIZZLE`), and bumps each group's Redis version key (`settingsVersionKey`). **`BrandingService`
  now delegates its writes here** (its flatten → `setMany`) and holds no `db` handle — the N14
  grandfather debt for branding is cleared.

Gateway: `GET /api/settings` (`settings.read`) + `PUT /api/settings` (`settings.manage`).

## Errors — keys, never prose (U24)

Both failure paths now return `rpcError(status, key, params)` from
[`@sanad/i18n`](../../libs/shared/i18n/i18n.md); the text lives only in the ar/en catalogs and is
rendered once at the gateway edge.

- **Integrations** (`application/integrations.service.ts`) — `settings.unknownProvider` (a
  capability/provider pair not in `INTEGRATION_CATALOG`) and `settings.unknownField` (a value
  for a key the provider's descriptor doesn't declare), both 400.
- **Setting values** (`application/settings-value.validate.ts`) — the descriptor type mismatch
  rejects with `settings.value.expected.localizedText` / `.boolean` / `.number` / `.string`,
  400, carrying the offending `key` as a param.

**Status fix that came with the migration.** These used to be `BadRequestException`s thrown
inside a `@MessagePattern` handler — a plain Nest `HttpException` does **not** serialize its
status across the broker, so a validation failure surfaced to the client as a **500** instead of
a 400. As `RpcException`s carrying `{ statusCode, messageKey, params }`, `toHttpException` now
maps the real status (MS2).

## Audit trail (P8.8) — the first adopter of `@sanad/audit`

The service mounts the shared **`audit_log`** fragment in its own database (MS5), at the same two
points the Outbox uses: re-exported from `db/schema/index.ts` so `drizzle-kit generate` sees it
(migration `0003_low_timeslip.sql`), and listed in the `schema` object in `db/schema/schema.ts`.
Migration **`0004_audit_log_immutable.sql`** installs the append-only row trigger and
**`0005_audit_log_no_truncate.sql`** adds the statement-level TRUNCATE guard — both bodies are
`AUDIT_IMMUTABILITY_SQL` from `@sanad/audit` verbatim (U3), because drizzle-kit cannot generate a
trigger and without them the table would be append-only only by convention. `0005` exists because a
row trigger does not fire for TRUNCATE, so `0004` alone left the trail erasable by one statement.

`AuditModule.forRoot()` is imported **after** `DrizzleModule.forRoot()` in `app.module.ts`; it makes
the audit interceptor resolvable, and `@Audited()` binds it per handler. It is deliberately **not**
registered globally: this is a hybrid app, and `connectMicroservice` gives the microservice its own
`ApplicationConfig`, so an `APP_INTERCEPTOR` would silently never run on the RMQ side — which is
where every write here arrives. P8.8 shipped that way once and logged a `system` actor on real
admin writes.

`SETTINGS_SET` carries `@Audited({ action: 'settings.updated', entityType: 'setting' })`, so the
interceptor opens the actor scope from the forwarded RMQ headers (identity — MS4 — plus the new
`x-sanad-request-context` carrying ip / user-agent / request id). `SettingsWriter` then:

- resolves each key's **current** value before writing, so the row records what actually moved
  rather than what was submitted (a value that was only ever a coded default reads as such);
- calls `recorder.recordWithin(txExec, …)` **inside the existing transaction**, beside the
  `settings.changed` Outbox enqueue — so the value, its event and its audit row commit or roll back
  as one. A rejected write leaves no row claiming it happened (proven in `settings-db.int.spec.ts`).

`SettingsWriter` gained two constructor dependencies for this: `SettingsResolver` (the before-read)
and `AuditRecorder`. Both are seams, not a DB handle — N14 still holds.

### The `security` group (P8.10.A)

The second group, and the proof the catalog is genuinely generic: it needed **zero admin component
changes** — `SettingFieldControl` already renders `boolean → Switch` and `number → Input`, and
`SettingsWriter`/`assertValidSettingValue` already type-check both. Only labels were added
(`group.security`, `section.security.rateLimit`, `field.security.rateLimit.*`).

`SECURITY_FIELDS` (`application/security-catalog/`) declares seven flat keys — a kill switch plus a
`limit`/`windowSeconds` pair for each of the gateway's `auth`, `lead` and `default` buckets. Unlike
`BrandingField` they carry no `path`: there is no record tree behind them, so the key IS the address.

**The coded defaults are imported from `@sanad/contracts`, not restated here.** The gateway uses the
same constants as its fail-open floor when the broker is unreachable, so a second copy would mean the
limit an operator sees is not the limit that applies (U3). Seeded by the existing idempotent
`SeedService` — catalog rows, not schema, so **no migration**.

`security` is also the first caller of `settings.group.resolve` from another service.

### The `tracking` group (P8.23.A1)

The third group, and the first one the generic admin page deliberately does **not** render: it has a
purpose-built screen at `/settings/tracking` (U0), and rendering it generically too would put two
differently-shaped editors on the same keys. It still writes through `SETTINGS_SET` like everything
else — the surface is bespoke, the write path is not.

`TRACKING_FIELDS` (`application/tracking-catalog/`) declares two sections:

- **`consent`** — `bannerEnabled` (default **true**: a tracking layer that loads without asking is
  the unlawful default, so the safe state is the one an operator must deliberately leave),
  `policyVersion` (bumping it re-asks every visitor; bounded `1..1_000_000` because `0` is the
  natural marker for "never asked"), `rememberDays` (180, capped at 730 — a consent record older
  than two years is an assumption, not a decision), and `privacyPolicyPath` / `cookiePolicyPath`,
  which default to **null**. A coded `/privacy` would aim the banner at a 404 until P8.23.B seeds
  the legal pages; an absent link is the lesser harm, and the admin card warns while they are unset.
- **`destinations`** — an `enabled` + `id` pair per entry of `TRACKING_DESTINATIONS` (GA4, GTM,
  Meta, Snap, TikTok). Every one ships **off with a null id**, so an unconfigured platform loads no
  third-party tag at all; `null` rather than `''` is what keeps "nobody entered one" distinguishable
  from "somebody entered nothing".

**`pattern` on the descriptor is new here.** A vendor id is the case `min`/`max` cannot cover: a
perfectly valid string that is nonetheless completely wrong, failing **silently** for as long as the
campaign runs. `SettingDescriptor` (and `SettingField`, so the control can refuse it before the round
trip) now carries `pattern` + `patternExample`; `assertValidSettingValue` enforces it for the string
types and rejects with `settings.value.invalidFormat` carrying the expected example (U24). `null` and
`''` still clear (U9) — a pattern that refused them would trap an operator removing a value.

The patterns are deliberately **loose shape hints, not vendor specifications**: these formats belong
to third parties and cannot be verified from this repo (U15), so they check prefix + charset with
generous lengths. One overlap is tolerated and declared rather than hidden — an all-digit TikTok id
is indistinguishable from a Meta pixel id, so the admin surfaces the ambiguity
(`matchingDestinationIds`) instead of rejecting a legitimate id.

Coded defaults again come from `@sanad/contracts`, and the group is seeded by the existing idempotent
`SeedService` — catalog rows, not schema, so **no migration**.

## Settings used

Owns them. Seeds the branding catalog idempotently at boot; seeds **no** values, so
branding resolves to coded defaults until an admin sets one (the P3 acceptance).
