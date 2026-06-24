import { randomUUID } from 'node:crypto';
import type { OutboxRecord } from '../../outbox.js';

/**
 * Build an unpublished outbox record. The `id` doubles as the message's idempotency
 * key for consumers (MS6); `occurredAt` comes from the producer's `DateTimeService`
 * (`nowIso()`), never `new Date()` (N3). The payload is JSON-serialized.
 */
export function createOutboxRecord(
  eventName: string,
  payload: unknown,
  occurredAt: string,
): Omit<OutboxRecord, 'publishedAt'> {
  return {
    id: randomUUID(),
    eventName,
    payload: JSON.stringify(payload),
    occurredAt,
  };
}
