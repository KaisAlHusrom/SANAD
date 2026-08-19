# @sanad/contracts

**Purpose:** the single source of truth for shared API/message shapes (U3). Zod schemas + inferred types, one concept per file (U10), consumed by every service and frontend. No DTO is redefined anywhere else.

**Tags:** `scope:shared`, `type:types` (depends on nothing internal).

## Concepts (`src/lib/common/`)

| File                | Exports                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `locale.ts`         | `localeSchema`, `Locale`, `DEFAULT_LOCALE` (=`ar`), `LOCALES`, `LOCALE_ENDONYMS`           |
| `direction.ts`      | `directionSchema`, `Direction`, `directionForLocale()` (ar→rtl)                            |
| `localized-text.ts` | `localizedTextSchema` (`.strict()`), `LocalizedText`, `pickLocalized()`                    |
| `envelope.ts`       | `envelopeSchema(data)`, `ResponseEnvelope<T>` — the `{success,message,data}` contract (F1) |
| `pagination.ts`     | `paginationMetaSchema`, `PaginationMeta`, `buildPaginationMeta()`                          |
| `list-query.ts`     | `listQuerySchema` (`.strict()`), `ListQuery`, `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`         |

**Events emitted/consumed:** none (pure contracts).
**Settings used:** none.
**Tests:** per-concept `*.spec.ts` (parse/validate, defaults, parity).

## P2 additions

- `lib/identity/*` — login/refresh requests, `TokenPair`, `AuthUser`, `AuthResult`, `LogoutResult`, `IDENTITY_PERMISSIONS`, RMQ pattern constants.
- `lib/common/paginated.types.ts` — `Paginated<T>` wire shape (repo `Page<T>` aliases it).
- `envelope.ts` — added `httpEnvelopeSchema`/`HttpResponseEnvelope` (the 5-field N9 wire envelope).

## P3 additions

- `lib/settings/*` — the settings domain contracts:
  - `setting-type.zod.types.ts` — `settingTypeSchema`/`SettingType`, `settingRequirementSchema`, `settingScopeSchema`, `resolveScopeSchema`/`ResolveScope`.
  - `branding.types.ts` — `BrandingRecord` (+ `BrandingColors`/`BrandingSocial`/`BrandingContact`/`PageAccent`) — the leaf-complete branding shape (F7).
  - `resolve.zod.types.ts` — `resolveRequestSchema`, `resolveGroupRequestSchema` (`.strict()`).
  - `branding-update.zod.types.ts` — `brandingUpdateRequestSchema` (deep-partial, `.strict()`, hex/url-validated), `BrandingUpdateRequest`.
  - `permission.ts` — `SETTINGS_PERMISSIONS` (`read`/`manage`); `message-pattern.ts` — `settings.branding.{get,update}`, `settings.resolve`, `settings.group.resolve`, `settings.changed`.

## P8.10.A additions — the `security` settings group

- `lib/settings/security-settings.ts` — the gateway's edge rate limits as a settings group.
  - `SECURITY_GROUP` (`'security'`), `SECURITY_SECTION_RATE_LIMIT` (`'rateLimit'`).
  - `rateLimitPolicyIdSchema` — `auth | lead | default | none`. `none` is the **exemption marker**
    (health checks), not a bucket, so `CountedRateLimitPolicyId` excludes it and
    `RATE_LIMIT_DEFAULTS` carries no entry for it.
  - `RateLimitPolicy` (`{ limit, windowSeconds }`), `SECURITY_SETTING_KEYS`, `rateLimitSettingKeys()`,
    `COUNTED_RATE_LIMIT_POLICIES`.
  - `RATE_LIMIT_DEFAULTS` + `RATE_LIMIT_ENABLED_DEFAULT` — the U9 coded defaults; `RATE_LIMIT_LIMIT_BOUNDS`
    / `RATE_LIMIT_WINDOW_BOUNDS` — the range the settings writer rejects outside of and the gateway
    clamps to.
- **Why the numbers live in contracts and not in settings-service.** Both sides need the _same_ ones:
  settings-service as the U9 coded default an operator edits, the gateway as its fail-open floor when
  the broker is unreachable. Two copies would drift, and the copy that drifts is the one nobody sees
  (U3). Same reasoning as `integration-catalog.ts`.
- `lib/settings/setting-catalog.types.ts` — `SettingField` gained `min?`/`max?`, alongside the existing
  `options?`: a descriptor-declared range, enforced on write and rendered on the control.

## P8.8 additions — money + sequence shapes

- `lib/money/*` — the shapes every priced document shares; the **arithmetic and formatting live in
  `@sanad/money`**, never here (U3 — one shape, one behaviour, two packages).
  - `currency-code.zod.types.ts` — `CURRENCY_CODES` (closed, spanning all three ISO exponents),
    `currencyCodeSchema`/`CurrencyCode`, `DEFAULT_CURRENCY` (`SAR`, the U9 coded default P8.9 turns into a
    setting).
  - `money.zod.types.ts` — `moneySchema` (`.strict()`): `{ amountMinor: int, currency }`. Minor units,
    always an integer; negative is legal (a credit, a reversal).
  - `tax-rate.zod.types.ts` — `taxRateSchema` (rate in **basis points**, translatable `label`,
    `inclusive`), `NO_TAX` — a zero rate is the default because no legal entity is registered yet.
  - `money.constants.ts` — `BASIS_POINTS_PER_UNIT`.
- `lib/sequence/*` — `sequenceFormatSchema` (`.strict()`: `prefix`, `reset`, `padding`, `separator`),
  `SEQUENCE_KINDS`/`SequenceKind`, `SEQUENCE_FORMAT_DEFAULTS` — the human-readable numbering P8.16/P8.17
  print. Allocation itself lives in `@sanad/sequence`.

## P8.7 additions — the `EVENT_CATALOG` (U27)

`lib/events/` declares **every** event the platform emits, on **either** bus, exactly once — with its
payload schema, its producer, and its consumers. This lib emits nothing itself; it is the index the
publish paths derive their allowed names from, which is what turns U27 from a convention into a
compiler check.

```
lib/events/
├── event-actor.ts             EVENT_ACTORS (closed union of every producing/consuming surface)
├── event-transport.ts         'broker' | 'client-bus'
├── event-consumer.types.ts    EventConsumer { actor, at, reacts }
├── event-definition.types.ts  EventDefinition — the orphan-requires-reason union
├── define-catalog/            defineCatalog() + spec
├── event-catalog/             EVENT_CATALOG + its derived types + spec
├── broker/                    4 × *.event.ts   (RabbitMQ, MS3 Outbox)
└── client-bus/               22 × *.event.ts   (admin portal, W4)
```

**Three laws the compiler enforces, not the reviewer:**

1. **An orphan must say why.** `EventDefinition` is a union: either `consumers` is a **non-empty
   tuple** (and `orphanReason?: never`), or it is `readonly []` **and** `orphanReason: string`.
   `consumers: []` with no reason matches neither member and does not compile.
2. **A key is its entry's name, and a name cannot repeat.** `defineCatalog` constrains the value at
   key `K` to `{ name: K }`; a duplicate name is a duplicate object key (TS1117).
3. **Only catalogued names can be published.** `BrokerEventName` narrows `OutboxStore.enqueue` and
   `createOutboxRecord` (which also demands _that_ name's payload type); `ClientBusEvent<Actor>`
   derives the admin portal's whole `DomainEvent` union.

Derived types: `EventName`, `EventPayloadOf<K>`, `BrokerEventName`, `ClientBusEventName`,
`ClientBusEventNameFor<Actor>`, `ClientBusEvent<Actor>`, `ClientBusEventOf<Actor, K>`. **Alias
`ClientBusEvent<A>` once per app** — re-deriving it at call sites re-distributes a mapped conditional
over the whole catalog each time.

**Ownership stays with the domains.** `LEAD_CREATED_EVENT` / `leadCreatedEventSchema` and
`MEDIA_DELETED_EVENT` / `mediaDeletedEventSchema` are untouched in `content/` and `media/`; the
catalog imports them. New this phase, filling two real gaps: `settings/settings-event.zod.types.ts`
(`settingsChangedEventSchema` — now carrying **`scopeId`**, without which a consumer could only drop
every cached scope instead of the one that moved) and `identity/user-event.zod.types.ts` +
`USER_REGISTERED_EVENT` (which had **no constant and no schema** at all).

### The 26 entries

| Event                                                                                                               | Transport  | Producer         | Consumers                                         |
| ------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------- | ------------------------------------------------- |
| `lead.created`                                                                                                      | broker     | content-service  | notifications-service                             |
| `media.deleted`                                                                                                     | broker     | media-service    | content-service                                   |
| `settings.changed`                                                                                                  | broker     | settings-service | **orphan → P8.12**                                |
| `user.registered`                                                                                                   | broker     | identity-service | **orphan → P8.12**                                |
| `settings.updated`                                                                                                  | client-bus | admin-portal     | `providers/branding/use-branding-theme.ts`        |
| `media.asset.uploaded`, `media.asset.deleted`, `media.folder.created`, `media.folder.changed`, `media.assets.moved` | client-bus | admin-portal     | `components/media-explorer/use-media-explorer.ts` |
| `lead.updated`, `notification.read`, `identity.user.changed`, `content.service.changed`, `content.blog.changed`     | client-bus | admin-portal     | `modules/dashboard/hooks/use-dashboard/`          |
| `auth.loggedIn`, `auth.loggedOut`                                                                                   | client-bus | admin-portal     | **orphan → P8.11**                                |
| `content.{testimonial,faq,team-member,portfolio,portfolio-category,blog-category,blog-tag,page,menu}.changed`       | client-bus | admin-portal     | **orphan → P8.23**                                |

`content.service.changed` and `content.blog.changed` were **half-wired** before this phase: they were
published but nothing listened, while `DashboardCounts.services` / `.blogPosts` are derived from
exactly those collections — so the dashboard tiles went stale on every edit. `settings.branding.updated`
was declared in the admin union, never published and never subscribed; it is **deleted**, not
catalogued.

**Events emitted/consumed:** none — this lib _declares_ every event and emits none.
**Tests:** `event-catalog.spec.ts` asserts the catalog's laws at runtime, including that every
`producedAt` and every `consumers[].at` **exists on disk** (a catalog that can lie about where its
producers live is documentation, not a contract). `define-catalog.spec.ts` proves the type laws with
`@ts-expect-error` probes.
