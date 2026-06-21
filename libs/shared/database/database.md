# @sanad/database

**Purpose:** the shared data layer primitives every service reuses (N1/N5). The timezone-aware DateTime service, per-model config helpers, and the Base/Translatable repository **contracts**. The concrete Drizzle-backed `BaseRepository` implementation lands with the first service that owns a database (P2+), so it can be tested against the service's `*_test` DB (TDD2).

**Tags:** `scope:shared`, `type:util`. **Deps:** `luxon`, `@sanad/contracts`.

## Concepts (`src/lib/`)

| File              | Exports                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `date-time.ts`    | `DateTimeService` (luxon-backed; `now/nowIso/nowMillis/addDays`, `fixed()` for tests). Use this instead of `new Date()`/`Date.now()` (N3). |
| `model-config.ts` | `ModelConfig<T>`, `defineModelConfig()`, `stripHidden()`, `pickFillable()` (N5)                                                            |
| `repository.ts`   | `Repository<T>`, `TranslatableRepository<T>`, `Page<T>` contracts (W6/N5)                                                                  |

**Events/settings:** none.
**Tests:** `date-time.spec.ts`, `model-config.spec.ts`.
