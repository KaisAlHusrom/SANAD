import { pgTable, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { pk, timestamps } from '@sanad/database';

/**
 * WHICH provider is currently active for a capability (N13) — the `default` of the driver/disk
 * pattern. Exactly one live row per capability (unique index); a capability with no row falls
 * back to "no active provider", which the consuming service surfaces as unconfigured (503).
 *
 * Kept as its own tiny table rather than a flag on `integration_config` so that activating a
 * provider is a single atomic write and can never leave two providers active at once.
 */
export const integrationActiveProviderTable = pgTable(
  'integration_active_provider',
  {
    id: pk(),
    capability: varchar('capability', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('integration_active_provider_capability_uq').on(
      table.capability,
    ),
  ],
);

export type IntegrationActiveProviderRow =
  typeof integrationActiveProviderTable.$inferSelect;
