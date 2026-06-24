import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * The transactional Outbox table (MS3). Each service owns its own copy (DB-per-
 * service, MS5) — include this in the service's Drizzle schema so a migration
 * creates it. Writes insert the business row AND an outbox row in the same tx; the
 * relay publishes afterwards. Timestamps are ISO strings (`mode: 'string'`) so we
 * never touch `new Date()` (N3).
 */
export const outboxTable = pgTable('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: text('event_name').notNull(),
  payload: text('payload').notNull(),
  occurredAt: timestamp('occurred_at', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  publishedAt: timestamp('published_at', {
    withTimezone: true,
    mode: 'string',
  }),
});
