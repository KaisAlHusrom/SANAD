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
 * ONE configured field of ONE provider of ONE capability (N13, the capability→providers rework).
 * Replaces the flat `integration_secret` (one row per global credential key), which could not
 * express "R2's bucket" vs "S3's bucket".
 *
 * A field is stored one of two ways, per its catalog descriptor:
 *  - **secret** (`secretAccessKey`, `password`) → AES-256-GCM in `ciphertext`/`iv`/`auth_tag`
 *    (declared `hidden` in the model config, N2) with `last4` for masked recognition; `value` null.
 *  - **non-secret** (`bucket`, `endpoint`, `host`…) → plaintext in `value`, so the owner can SEE
 *    and edit it in the admin; the crypto columns stay null.
 *
 * The decrypted value crosses only the internal broker (`settings.integration.resolve`, MS2),
 * never the API boundary. `updated_by_user_id` carries NO FK — users live in the identity
 * service's DB (MS5).
 */
export const integrationConfigTable = pgTable(
  'integration_config',
  {
    id: pk(),
    capability: varchar('capability', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    fieldKey: varchar('field_key', { length: 64 }).notNull(),
    value: text('value'),
    ciphertext: text('ciphertext'),
    iv: text('iv'),
    authTag: text('auth_tag'),
    last4: varchar('last4', { length: 4 }),
    updatedByUserId: uuid('updated_by_user_id'),
    ...timestamps(),
    ...softDelete(),
  },
  // Partial unique — one live row per (capability, provider, field); a soft-deleted (cleared)
  // row never blocks re-setting the same field, so "clear then re-enter" stays safe.
  (table) => [
    uniqueIndex('integration_config_field_uq')
      .on(table.capability, table.provider, table.fieldKey)
      .where(sql`${table.deletedAt} is null`),
    index('integration_config_provider_idx').on(
      table.capability,
      table.provider,
    ),
    index('integration_config_deleted_at_idx').on(table.deletedAt),
  ],
);

export type IntegrationConfigRow = typeof integrationConfigTable.$inferSelect;
