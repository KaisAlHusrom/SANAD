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
