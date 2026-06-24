import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Idempotency ledger for event consumers (MS6). A `(consumer_id, message_id)` row is
 * inserted in the SAME transaction as the business update; a duplicate delivery's insert
 * conflicts → the handler rolls back → no double-effect. `message_id` is the producer's
 * outbox record id (the stable idempotency key). `processed_at` is an ISO string (mode:
 * 'string') so we never touch `new Date()` for it at read time (N3).
 */
export const processedMessageTable = pgTable(
  'processed_message',
  {
    consumerId: text('consumer_id').notNull(),
    messageId: text('message_id').notNull(),
    processedAt: timestamp('processed_at', {
      withTimezone: true,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.consumerId, table.messageId] })],
);

export type ProcessedMessageRow = typeof processedMessageTable.$inferSelect;
