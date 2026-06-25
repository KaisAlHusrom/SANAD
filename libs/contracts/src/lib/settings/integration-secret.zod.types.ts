import { z } from 'zod';
import { secretKeySchema } from './secret-key.zod.types.js';

/**
 * RMQ request payloads for the integration-secret vault (MS2). Validated by the
 * settings-service message-controller with a `ZodValidationPipe` (N7 `.strict()`).
 * `resolve` is server-side only (returns the decrypted value over the internal broker,
 * never to a client, N13); `set` carries the gateway-folded `:key` + body `value`.
 */
export const secretResolvePayloadSchema = z
  .object({ key: secretKeySchema })
  .strict();
export type SecretResolvePayload = z.infer<typeof secretResolvePayloadSchema>;

export const secretSetPayloadSchema = z
  .object({ key: secretKeySchema, value: z.string().min(1) })
  .strict();
export type SecretSetPayload = z.infer<typeof secretSetPayloadSchema>;
