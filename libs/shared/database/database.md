# @sanad/database

**Purpose:** the shared data layer every service reuses (N1/N5). The timezone-aware DateTime service and the **enhanced repository canon** — a config-driven `BaseRepository` + `TranslatableRepository` (ported from the smart-restaurant reference) with a fluent immutable query builder, whitelisted filters, mass-assignment guard, hidden/cast/append read pipeline, and locale-aware translation handling. Plus the per-service Drizzle module.

**Tags:** `scope:shared`, `type:util`. **Deps:** `luxon`, `pg`, `drizzle-orm`, `@nestjs/common`, `@sanad/contracts`.

## Concepts (`src/lib/`)

| File            | Exports                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `date-time.ts`  | `DateTimeService` (luxon; `now/nowIso/nowMillis/addDays`, `fixed()` for tests). Use instead of `new Date()`/`Date.now()` (N3). |
| `repository.ts` | `Page<T>` (alias of the contract `Paginated<T>`).                                                                              |

## The repository canon (`src/lib/drizzle/repository`, N1/N5)

The single gateway for DB access. A concrete repo declares a **`ModelConfig`** (table, hidden, fillable/guarded, casts, appends, scopes, softDeletes, relationCounts, translatable) and extends the base; queries stay in the repo, never a service.

- **`BaseRepository<TTable, TSelect, …>`** — `super(db, dateTime, config)`. Fluent immutable builder (`query()/where()/whereIn()/scope()/with()/withCount()/withTrashed()/withHidden()`), terminals (`find/findOrFail/first/all/paginate/paginateFiltered/count`), writes (`create/createMany/update/delete/restore/forceDelete`) with override lifecycle hooks (`beforeCreate`/`afterCreate`/…) for in-process side effects (N6). Soft-deletes (N2) + hidden fields (N2) enforced by default; read pipeline = casts → appends → hidden.
- **`TranslatableRepository<TTable, TTrans, …>`** — adds `createLocalized/updateLocalized/findLocalized/paginateLocalized/paginateFilteredLocalized/mergeTranslations/findAllTranslations/searchAcrossLocales` for entities whose translatable columns live in a `*_translations` table (N5).
- **`RepoQuery`** — the copy-on-write builder. **`FilterSpec` + `applyFilters`** — whitelisted column/search filters (N7), never raw passthrough; the soft-delete scope can't be bypassed. **`paginateArgsFromListQuery`** — adapts the contract `ListQuery` → builder `PaginateArgs`. **`ModelConfig`** + casts/scopes/relationCounts types. **`RecordNotFoundError`** (→ HTTP 404).

### SANAD adaptations vs the smart-restaurant canon

- **No injected `EventBus`** — lifecycle hooks are plain override seams; cross-service events go through the **Outbox** in the application layer (MS3).
- **`db` is the structural `RepoDb`** (`Pick` of `NodePgDatabase`) so one base works across every service's own DB (MS5) and inside a transaction.
- **UTC via `DateTimeService`** — active-timezone read conversion is deferred until the clock gains timezone support.
- **drizzle 0.44 guard** — `.from()/.insert()/.delete()` carry a `TableLikeHasEmptySelection` guard that can't resolve for a generic `TTable`; the write/read table arg is cast to `PgTable` (a concrete table is never a `Subquery`, so the guard is `false`). The canon predates this guard (smart-restaurant uses drizzle 0.38).

**Per-service DB:** `DrizzleModule.forRoot({ connectionString, schema })` + `PG_POOL`/`DRIZZLE` tokens; UTC pool, closes on shutdown (MS8). One per service (MS5). Column helpers: `pk()` (uuid), `timestamps()`, `softDelete()`.

**Events/settings:** none.
**Tests:** `date-time.spec.ts`, `drizzle/repository/base-repository.spec.ts` (read pipeline + mass-assignment); the builder/translatable query execution is covered by the identity + settings service `*_test` integration tests (TDD2).

## P8.8 addition — `testing/ensure-test-database/`

`ensureTestDatabase(url)` creates a `*_test` database if it is missing. **Test harness only** — it
refuses any name not ending in `_test` (TDD2) and no service ever calls it.

It exists because `infra/postgres/init/01-create-databases.sql` runs **once, on an empty data
volume**: a database added to that file after the dev stack first booted never appears on an
existing machine, so the suite needing it would "skip cleanly" forever — green, and proving nothing
(the 2026-07-19 false-green class). It throws with the underlying reason rather than swallowing it,
so a caller that cannot create its database says why.

## `testing/require-db-tests/` — make a skip a failure where the DB is guaranteed

`failIfDbTestsRequired(url, cause)` throws when `REQUIRE_DB_TESTS=1` and the database could not be
reached, instead of letting the suite degrade to `describe.skip`. Called from the `catch` of every
`*.int.spec.ts` `tryConnect()`; the connection string is redacted in the message and the original
error is attached as `cause`.

Skipping is **correct locally** — OPS5 keeps the dev stack DOWN for the verifier, so Postgres
genuinely is not there. It was **wrong in CI**: the workflow had no Postgres service, so all nine
integration suites had never executed once while reporting green. `.github/workflows/ci.yml` now
runs a `postgres:16-alpine` service on the same port and credentials as the dev stack, seeds it
with `infra/postgres/init/01-create-databases.sql`, and sets `REQUIRE_DB_TESTS=1` — so a skip there
is now a hard failure. Verified by running a suite with the flag set and no database: it fails with
the named error rather than passing quietly.
