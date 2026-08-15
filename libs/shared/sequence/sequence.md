# @sanad/sequence

**Purpose:** gap-free, human-readable numbering (P8.8) — `PRO-2026-0001`, `CTR-2026-0001`,
`INV-2026-0001`. `uuid` stays every entity's primary key; this is the number a **person** quotes on a
phone call and a court reads on a contract. Consumed by proposals (P8.16), contracts (P8.17), rendered
documents (P8.13) and, later, invoices (P10).

**Tags:** `scope:shared`, `type:util`. **Deps:** `@sanad/contracts`, `@sanad/database`, `drizzle-orm`
(dev: `pg`, `drizzle-kit` for the integration suite). The format _shapes_ live in `@sanad/contracts` (U3).

## Concepts (`src/lib/`)

| File / folder               | Exports                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sequence-counter.table.ts` | `sequenceCounterTable` — the shared fragment each service mounts **in its own DB** (MS5), keyed `(entity, period)`                                                   |
| `sequence-store.types.ts`   | `SequenceStore`, `SequenceDb`, `CONTINUOUS_PERIOD`                                                                                                                   |
| `allocated-number.types.ts` | `AllocatedNumber` (`number` + raw `value` + `period`)                                                                                                                |
| `sequence-number/`          | `periodFor` (UTC year, via `DateTimeService` — N3), `formatSequenceNumber`                                                                                           |
| `drizzle-sequence-store/`   | `DrizzleSequenceStore` — the single-statement allocator                                                                                                              |
| `sequence-allocator/`       | `SequenceAllocator.next(exec, kind, override?)` — allocate + format in one call                                                                                      |
| `migrations/`               | drizzle-kit output for the fragment: applied by this lib's own integration suite, and the reference DDL an adopting service compares its generated migration against |

## Mounting it in a service

Exactly like the shared Outbox: re-export `sequenceCounterTable` from the service's
`db/schema/index.ts` (so `drizzle-kit generate` sees it) **and** add it to the `schema` object in
`db/schema/schema.ts` (so the runtime handle knows it). Then allocate inside the business transaction:

```ts
await this.tx.run(async (txExec) => {
  const row = await this.proposals.insert(txExec, data); // the business write
  const { number } = await this.sequences.next(txExec, 'proposal'); // …then the number
  await this.proposals.setNumber(txExec, row.id, number);
});
```

## The three decisions worth not re-deriving

- **One statement, not `SELECT … FOR UPDATE`.** Allocation is a single
  `insert … on conflict do update set last_value = last_value + 1 returning last_value`. It takes the
  row lock on exactly one counter, in one round trip, inside a lock the caller already holds open. The
  P8.8 plan text said `FOR UPDATE`; this is deliberately different, and not only for the round trip —
  `RepoDb`, what `TransactionRunner.run` yields (N14), exposes **no `execute`**, so raw locking SQL
  cannot be issued through the seam an application service is allowed to hold.
- **Gap-free means "allocated inside the caller's transaction".** A rolled-back write rolls the counter
  back with it, so the number goes to the next caller instead of being burned. Proven by a spec that
  aborts a transaction and asserts the next allocation returns the _same_ number.
- **Allocate LATE.** The counter row is locked until the caller commits; doing it first serialises the
  whole write path behind it.

**Events:** none. **Settings:** none yet — `SEQUENCE_FORMAT_DEFAULTS` in `@sanad/contracts` are the
coded defaults (U9) and `SequenceAllocator.next` takes a validated per-kind `override`, which is the
seam **P8.9** fills from settings.
**Tests:** `sequence-number`, `sequence-allocator` unit specs + **`sequence-db.int.spec.ts`** against
`sequence_test` (TDD2) — including the phase's named acceptance proof: **20 concurrent transactions,
no gaps, no duplicates**, plus the rollback case. The assertion was proven to bite: a deliberately
non-atomic read-then-write allocator run through the same harness produced **17 duplicates of 20**.
