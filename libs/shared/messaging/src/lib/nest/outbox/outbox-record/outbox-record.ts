import { randomUUID } from 'node:crypto';
import type { BrokerEventName, EventPayloadOf } from '@sanad/contracts';
import type { OutboxEnqueueRecord } from '../../../outbox.js';

/**
 * Build an unpublished outbox record. The `id` doubles as the message's idempotency key for
 * consumers (MS6); `occurredAt` comes from the producer's `DateTimeService` (`nowIso()`), never
 * `new Date()` (N3). The payload is JSON-serialized.
 *
 * The generic is the enforcement half of U27: only a name the `EVENT_CATALOG` declares as a
 * broker event may be enqueued, and its payload must match THAT name's catalogued schema — both
 * are typecheck failures, not runtime surprises.
 */
export function createOutboxRecord<TName extends BrokerEventName>(
  eventName: TName,
  payload: EventPayloadOf<TName>,
  occurredAt: string,
): OutboxEnqueueRecord {
  return {
    id: randomUUID(),
    eventName,
    payload: JSON.stringify(payload),
    occurredAt,
  };
}
