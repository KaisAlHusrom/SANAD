import type { ModelConfig } from '@sanad/database';
import {
  integrationActiveProviderTable,
  integrationConfigTable,
} from '../../db/schema/index.js';

/**
 * Integration-config rows (N13). The encrypted columns are `hidden` (N2) so they are stripped
 * from any output by default — the service opts in via `withHidden()` to decrypt server-side,
 * and the masked status returned to the admin never includes them. `value` is NOT hidden: it
 * holds only non-secret fields (bucket, endpoint, host…), which the owner is meant to see.
 */
export const integrationConfigModelConfig: ModelConfig<
  typeof integrationConfigTable
> = {
  table: integrationConfigTable,
  hidden: ['ciphertext', 'iv', 'authTag'],
  fillable: [
    'capability',
    'provider',
    'fieldKey',
    'value',
    'ciphertext',
    'iv',
    'authTag',
    'last4',
    'updatedByUserId',
  ],
  softDeletes: true,
};

/**
 * The active-provider selection per capability — no secrets, nothing hidden.
 * `softDeletes: false` is REQUIRED: the table carries only `...timestamps()` (no `deleted_at`), so
 * the base repository's `softDeletes ?? true` default would make every read throw
 * "Unknown column 'deletedAt'". A soft-delete column would also fight the
 * `integration_active_provider_capability_uq` unique index (one active provider per capability).
 */
export const integrationActiveProviderModelConfig: ModelConfig<
  typeof integrationActiveProviderTable
> = {
  table: integrationActiveProviderTable,
  fillable: ['capability', 'provider', 'updatedByUserId'],
  softDeletes: false,
};
