import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A third-party integration credential, encrypted at rest (N13). One live row per `key`
 * (e.g. `SMTP_PASSWORD`). The plaintext is AES-256-GCM encrypted (`SecretCipherService`);
 * `ciphertext`/`iv`/`auth_tag` are the encrypted form and are declared `hidden` in the
 * model config (N2, defense-in-depth). `last4` + `updated_at` + `updated_by_user_id` are
 * the masked status + audit surfaced to the admin (who/when/which — never the value). The
 * decrypted value lives server-side only, resolved via `settings.resolve-secret` (MS2).
 * `updated_by_user_id` carries NO FK — users live in the identity service's DB (MS5).
 */
export const integrationSecretTable = pgTable(
  'integration_secret',
  {
    id: pk(),
    key: varchar('key', { length: 64 }).notNull(),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    last4: varchar('last4', { length: 4 }),
    updatedByUserId: uuid('updated_by_user_id'),
    ...timestamps(),
    ...softDelete(),
  },
  // Partial unique index — one live row per key; a soft-deleted (cleared) row never blocks
  // re-creating the same key, so "rotate" can clear-then-insert safely.
  (table) => [
    uniqueIndex('integration_secret_key_uq')
      .on(table.key)
      .where(sql`${table.deletedAt} is null`),
    index('integration_secret_deleted_at_idx').on(table.deletedAt),
  ],
);

export type IntegrationSecretRow = typeof integrationSecretTable.$inferSelect;
