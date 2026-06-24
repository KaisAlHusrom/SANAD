import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Shared Drizzle column helpers so every service's tables declare ids, timestamps,
 * and soft-delete the same way (N1/N2). Timestamps are timezone-aware and stored in
 * UTC; the DB defaults them so writes never need `new Date()` (N3).
 */

/** A UUID primary key, defaulted by the database. */
export const pk = () => uuid('id').primaryKey().defaultRandom();

/** `created_at` / `updated_at`, both UTC and DB-defaulted to now. */
export const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A nullable `deleted_at` marking a soft-deleted row (N2). Null = live. */
export const softDelete = () => ({
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
