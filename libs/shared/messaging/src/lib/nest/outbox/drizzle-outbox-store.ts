import { asc, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DateTimeService } from '@sanad/database';
import type { OutboxRecord, OutboxStore } from '../../outbox.js';
import { outboxTable } from './outbox-table.js';

/**
 * A Drizzle handle or transaction — enqueue runs inside the business transaction
 * (MS3), while the relay's pull/mark run on the pooled connection.
 */
export type OutboxDb = Pick<
  NodePgDatabase<Record<string, never>>,
  'insert' | 'select' | 'update'
>;

type OutboxRow = typeof outboxTable.$inferSelect;

function toRecord(row: OutboxRow): OutboxRecord {
  return {
    id: row.id,
    eventName: row.eventName,
    payload: row.payload,
    occurredAt: row.occurredAt,
    publishedAt: row.publishedAt,
  };
}

/**
 * Drizzle-backed {@link OutboxStore} (MS3). Construct with a transaction to
 * `enqueue` atomically with the business write; the relay constructs it with the
 * pooled db to `pullUnpublished` / `markPublished`.
 */
export class DrizzleOutboxStore implements OutboxStore {
  constructor(
    private readonly db: OutboxDb,
    private readonly clock: DateTimeService,
  ) {}

  async enqueue(record: Omit<OutboxRecord, 'publishedAt'>): Promise<void> {
    await this.db.insert(outboxTable).values({
      id: record.id,
      eventName: record.eventName,
      payload: record.payload,
      occurredAt: record.occurredAt,
    });
  }

  async pullUnpublished(limit: number): Promise<OutboxRecord[]> {
    const rows = await this.db
      .select()
      .from(outboxTable)
      .where(isNull(outboxTable.publishedAt))
      .orderBy(asc(outboxTable.occurredAt))
      .limit(limit);
    return rows.map(toRecord);
  }

  async markPublished(id: string): Promise<void> {
    await this.db
      .update(outboxTable)
      .set({ publishedAt: this.clock.nowIso() })
      .where(eq(outboxTable.id, id));
  }
}
