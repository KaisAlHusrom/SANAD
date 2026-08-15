# @sanad/audit

**Purpose:** the append-only audit trail (P8.8) — who did what, to which entity, from where, and
whether it worked. Built **before** the thing it protects: e-signature (P8.14) is only evidence if the
trail already exists, and retrofitting one onto signed documents leaves the earliest contracts with the
weakest record. Also the change history behind admin surfaces (P8.19/P8.20) and the security record for
identity's new flows (P8.11).

**Tags:** `scope:shared`, `type:util`. **Deps:** `@nestjs/common`, `@nestjs/core`, `@sanad/auth`,
`@sanad/contracts`, `@sanad/database`, `@sanad/messaging`, `drizzle-orm`, `rxjs`
(dev: `pg`, `drizzle-kit`, `@nestjs/microservices` for the specs).

## Concepts (`src/lib/`)

| File / folder                     | Exports                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-log.table.ts`              | `auditLogTable` — the shared fragment each service mounts **in its own DB** (MS5)                                                     |
| `audit-immutability.constants.ts` | `AUDIT_IMMUTABILITY_SQL` (trigger + function), `AUDIT_IMMUTABILITY_ERROR_CODE`                                                        |
| `audit-entry.types.ts`            | `AuditActor`, `AuditOutcome`, `AuditEntryInput`, `AuditRecord`, `AuditScope`, `AuditDb`, **`AuditStore`** (abstract class = DI token) |
| `audit.constants.ts`              | `ACTION_PATTERN`, `SYSTEM_ACTOR`, `AUDITED_METADATA_KEY`                                                                              |
| `redact.constants.ts` · `redact/` | `REDACTED`, `SECRET_KEY_PATTERNS`, `MAX_REDACT_DEPTH`, `redact`                                                                       |
| `diff-fields/`                    | `diffFields`, `FieldDiff`                                                                                                             |
| `drizzle-audit-store/`            | `DrizzleAuditStore` — batch insert, redacting, no update/delete                                                                       |
| `nest/audit-recorder/`            | **`AuditRecorder`** — `runInScope`, `record`, `recordWithin`, `flush`                                                                 |
| `nest/decorators/`                | `@Audited({ action, entityType })`                                                                                                    |
| `nest/interceptors/audit/`        | `AuditInterceptor`                                                                                                                    |
| `nest/audit.module.ts`            | `AuditModule.forRoot()`                                                                                                               |
| `migrations/`                     | drizzle-kit output for the fragment (this lib's suite + reference DDL)                                                                |

## Mounting it in a service

1. Re-export `auditLogTable` from `db/schema/index.ts` and add it to the `schema` object in
   `db/schema/schema.ts` — the same two mount points the shared Outbox uses.
2. `drizzle-kit generate` for the table, then `drizzle-kit generate --custom` for a migration whose
   body is `AUDIT_IMMUTABILITY_SQL`. **drizzle-kit cannot generate a trigger**, so this step is not
   optional — without it the table is append-only only by convention.
3. `AuditModule.forRoot()` in `AppModule`, after `DrizzleModule.forRoot()`.
4. `@Audited({ action: 'settings.updated', entityType: 'setting' })` on the handler; inside the
   business transaction, `recorder.recordWithin(txExec, { entityId, before, after })`.

## The five decisions worth not re-deriving

- **Immutability is enforced by the DATABASE.** A `before update or delete` trigger raises
  `restrict_violation`, so the rule holds for a `psql` session and a future migration too — and the
  store's surface has no update or delete, so the mutation cannot even be expressed. Both directions
  are proven in `audit-db.int.spec.ts`, against the driver's own error **and its SQLSTATE**: Drizzle
  rethrows as `Failed query: …`, so asserting on the wrapper would have passed for any failing query.
- **The actor is stamped from an ambient scope, never passed as an argument.** `AuditRecorder` holds
  it in an `AsyncLocalStorage` scope the interceptor opens, so application code records _what changed_
  and nothing else. That is what stops the trail rotting the first time a new write path is added.
- **The interceptor wraps the SUBSCRIPTION.** `next.handle()` only builds an observable — the handler
  runs when it is subscribed, after every interceptor has returned. `als.run(scope, () => next.handle())`
  would leave the handler outside the scope and every actor silently null. Pinned by a spec; the naive
  form was written deliberately once and failed 5 of 8 tests.
- **`recordWithin(tx, …)` for anything that is evidence.** It writes inside the caller's transaction,
  so the business row, its Outbox event and its audit row commit or roll back as one — a rolled-back
  write leaves no row claiming it happened (proven). `record()` + the interceptor's flush is the
  after-the-fact path for everything else.
- **A failed audit write never fails the request**, and redaction happens at the store rather than at
  call sites — this row is the one place the platform deliberately copies whatever a write contained,
  which makes it the easiest place for a credential to land in plain text (N13).

**Events:** none — audit is a write-side record with no consumer, so nothing is added to the
`EVENT_CATALOG`; inventing an event here would only manufacture another declared orphan (U27d).
**Settings:** none. Retention/pruning is deliberately absent: a trail you can trim is not evidence.
**Tests:** `redact`, `diff-fields`, `audit-recorder`, `audit.interceptor` unit specs +
**`audit-db.int.spec.ts`** against `audit_test` (TDD2) — 38 in total.
