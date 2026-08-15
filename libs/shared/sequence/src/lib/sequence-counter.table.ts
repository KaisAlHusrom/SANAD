import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * The per-entity, per-period counter behind human-readable numbering (P8.8). Each service owns
 * its own copy (DB-per-service, MS5) — include it in the service's Drizzle schema so a migration
 * creates it, exactly like the shared `outbox` table.
 *
 * The composite primary key `(entity, period)` is what makes allocation safe: the single upsert
 * that bumps `last_value` takes a row lock on precisely one counter, so two concurrent
 * transactions serialise on that row and nothing else in the service blocks.
 *
 * `updated_at` is an ISO string (`mode: 'string'`) so no caller ever reaches for `new Date()` (N3).
 */
export const sequenceCounterTable = pgTable(
  'sequence_counter',
  {
    entity: text('entity').notNull(),
    period: text('period').notNull(),
    lastValue: integer('last_value').notNull().default(0),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.entity, table.period] })],
);
