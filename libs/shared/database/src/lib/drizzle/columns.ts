import { customType, timestamp, uuid } from 'drizzle-orm/pg-core';

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

/**
 * A `jsonb` column that stores a **scalar** (string / number / boolean) and gives it back
 * with its type intact. **Use this, never drizzle's `jsonb()`, for a jsonb column that can
 * hold a bare JSON string.**
 *
 * Why it has to exist: node-postgres already parses `jsonb`, so drizzle's own `jsonb()`
 * receives an ALREADY-PARSED value and runs `JSON.parse` on it a second time. When the stored
 * value is a JSON *string* whose text is itself valid JSON, that second parse silently changes
 * its type — `"123456789012345"` reads back as a **number**, `"true"` as a **boolean**,
 * `'{"a":1}'` as an **object**. Every other string throws inside the parse and is swallowed, so
 * the values that survive look perfectly fine and only the unlucky ones are wrong. Nothing logs
 * and nothing fails; the value simply arrives as the wrong type, arbitrarily far downstream.
 *
 * Found in P8.23.A1 by the runtime gate: a **Meta pixel id** is all digits, so a correctly
 * saved id resolved as a number, the gateway's `typeof === 'string'` check dropped the whole
 * destination from the public tracking config, and the admin field rendered blank. No test at
 * any layer could see it, because every layer was individually right.
 *
 * The fix is to stop re-parsing: read through untouched (pg has already done the work) and
 * keep serializing on the way in, so the column is ordinary `jsonb` on disk.
 */
export const jsonbScalar = customType<{
  data: string | number | boolean;
  driverData: unknown;
}>({
  dataType: () => 'jsonb',
  fromDriver: (value) => value as string | number | boolean,
  toDriver: (value) => JSON.stringify(value),
});
