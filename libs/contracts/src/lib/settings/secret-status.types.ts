import type { SecretKey } from './secret-key.zod.types.js';

/**
 * The **masked** status of one integration secret (N13). This is the ONLY shape the secret
 * status/set endpoints return — the decrypted value NEVER crosses the API boundary. `last4`
 * is the stored last-four characters for recognition; `updatedAt`/`updatedByUserId` are the
 * audit trail (when + who), never the value. `isSet` is true when a value is configured (in
 * the vault or via the env fallback); `fromEnv` distinguishes the two. A response DTO (not
 * runtime-validated inbound), so a plain interface (U16).
 */
export interface SecretStatus {
  key: SecretKey;
  isSet: boolean;
  fromEnv: boolean;
  last4: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}
