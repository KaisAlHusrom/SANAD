import { sql } from 'drizzle-orm';
import type { DateTimeService } from '@sanad/database';
import { sequenceCounterTable } from '../sequence-counter.table.js';
import type { SequenceDb, SequenceStore } from '../sequence-store.types.js';

/**
 * Drizzle-backed {@link SequenceStore}. Allocation is **one statement**:
 *
 * ```sql
 * insert into sequence_counter (entity, period, last_value, updated_at) values (…, 1, …)
 *   on conflict (entity, period) do update set last_value = sequence_counter.last_value + 1
 *   returning last_value
 * ```
 *
 * The upsert takes the row lock on exactly one counter and releases it at COMMIT, so concurrent
 * transactions serialise on that row and each leaves with a distinct value. Two reasons this is
 * used instead of the `SELECT … FOR UPDATE` + `UPDATE` pair the plan sketched: it is one round
 * trip inside a lock the caller is holding open, and `RepoDb` — what `TransactionRunner.run`
 * yields (N14) — deliberately exposes no `execute`, so raw locking SQL cannot be issued through
 * the seam an application service is allowed to hold.
 *
 * **The run is gap-free only because the counter moves inside the caller's transaction:** if the
 * business write rolls back, the bump rolls back with it and the number is handed to the next
 * caller instead of being burned.
 */
export class DrizzleSequenceStore implements SequenceStore {
  constructor(private readonly clock: DateTimeService) {}

  async allocate(
    exec: SequenceDb,
    entity: string,
    period: string,
  ): Promise<number> {
    const now = this.clock.nowIso();
    const rows = await exec
      .insert(sequenceCounterTable)
      .values({ entity, period, lastValue: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: [sequenceCounterTable.entity, sequenceCounterTable.period],
        set: {
          lastValue: sql`${sequenceCounterTable.lastValue} + 1`,
          updatedAt: now,
        },
      })
      .returning({ lastValue: sequenceCounterTable.lastValue });

    const allocated = rows[0]?.lastValue;
    if (allocated === undefined) {
      // An upsert with RETURNING cannot come back empty; if it did, the number would be
      // unknown and a document would be numbered by guess. Fail loudly instead (U24f).
      throw new Error(
        `sequence: allocation for ${entity}/${period} returned no row`,
      );
    }
    return allocated;
  }
}
