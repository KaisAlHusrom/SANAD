import type { ModelConfig } from '@sanad/database';
import { integrationSecretTable } from '../../db/schema/index.js';

/**
 * Integration-secret rows (N13). The encrypted columns are `hidden` (N2) so they are
 * stripped from any output by default — the service opts in via `withHidden()` to read
 * them for decryption, and the masked status returned to the admin never includes them.
 */
export const integrationSecretModelConfig: ModelConfig<
  typeof integrationSecretTable
> = {
  table: integrationSecretTable,
  hidden: ['ciphertext', 'iv', 'authTag'],
  fillable: ['key', 'ciphertext', 'iv', 'authTag', 'last4', 'updatedByUserId'],
  softDeletes: true,
};
