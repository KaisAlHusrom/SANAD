import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pk, timestamps } from '@sanad/database';
import { userTable } from './user.table.js';

/**
 * Persisted refresh tokens (stateful refresh, decision 3). `id` is the token's `jti`;
 * `token_hash` is the argon2 hash of the issued token (the raw token is never stored).
 * Rotated on every refresh: the old row is revoked, a new one issued. Timestamps are
 * ISO strings (`mode: 'string'`) so we never call `new Date()` (N3).
 */
export const refreshTokenTable = pgTable('refresh_token', {
  id: pk(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
  ...timestamps(),
});

export type RefreshTokenRow = typeof refreshTokenTable.$inferSelect;
