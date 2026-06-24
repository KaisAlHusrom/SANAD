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
global → coded default** (`SETTINGS_DEFAULTS` in code). `localized_text` values assemble
`{ar, en}` with **per-locale** fallback to the coded default, so a partial translation
never renders a blank locale. The **branding assembler** deep-merges resolved values over
`BRANDING_DEFAULTS`, guaranteeing every leaf is present. Override scope (`client`) is
wired but dormant in MVP — only `global` is populated until the client portal exists.

The coded defaults compose from the locked design tokens (`@sanad/config`:
`websiteTokens`, `pageAccents`, `fonts`) + the bilingual brand copy
(`.claude/design/content-defaults.md`). `BRANDING_FIELDS` is the single source driving
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

## Events emitted (MS3 — Outbox)

| Event              | Payload            | Consumers                            |
| ------------------ | ------------------ | ------------------------------------ |
| `settings.changed` | `{ group, scope }` | (none yet — P8 website revalidation) |

## Gateway surface

`GET /api/branding` (**public** — website renders unauthenticated; returns coded
defaults when unset) and `PUT /api/branding` (guarded `settings.manage`, MS4).

## Settings used

Owns them. Seeds the branding catalog idempotently at boot; seeds **no** values, so
branding resolves to coded defaults until an admin sets one (the P3 acceptance).
