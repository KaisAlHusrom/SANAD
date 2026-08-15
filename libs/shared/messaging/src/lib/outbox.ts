import type { BrokerEventName } from '@sanad/contracts';

/**
 * A row in the transactional Outbox. Writes persist the business change AND an
 * outbox record in the SAME transaction; a relay publishes records to RabbitMQ
 * afterwards — so we never dual-write to DB + broker (MS3).
 */
export interface OutboxRecord {
  id: string;
  eventName: string;
  payload: string;
  occurredAt: string;
  publishedAt: string | null;
}

/**
 * What the application may APPEND: only an event the `EVENT_CATALOG` declares (U27c).
 * Narrowing the WRITE side rather than the persisted row means the relay still reads rows back
 * as plain strings, while an un-catalogued name cannot be enqueued at all.
 */
export type OutboxEnqueueRecord = Omit<OutboxRecord, 'publishedAt'> & {
  readonly eventName: BrokerEventName;
};

/** The store the application writes outbox records to inside its transaction. */
export interface OutboxStore {
  /** Append an event to the outbox within the current transaction. */
  enqueue(record: OutboxEnqueueRecord): Promise<void>;
  /** Fetch unpublished records for the relay to publish. */
  pullUnpublished(limit: number): Promise<OutboxRecord[]>;
  /** Mark a record published after the broker confirms. */
  markPublished(id: string): Promise<void>;
}
