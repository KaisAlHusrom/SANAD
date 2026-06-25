import { z } from 'zod';

/**
 * Set or rotate one integration secret (N13). The plaintext `value` is encrypted
 * server-side and stored; it is never echoed back. `.strict()` rejects unknown keys (N7).
 * The target secret key is the `:key` path param on the gateway (validated against
 * `secretKeySchema`), not part of the body.
 */
export const setSecretRequestSchema = z
  .object({
    value: z.string().min(1),
  })
  .strict();
export type SetSecretRequest = z.infer<typeof setSecretRequestSchema>;
