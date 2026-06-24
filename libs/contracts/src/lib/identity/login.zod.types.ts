import { z } from 'zod';

/**
 * Login credentials posted to the gateway and forwarded to the identity service
 * (MS2). Strict so unknown keys are rejected (N7). Runtime-validated → `.zod.types`
 * file (U16).
 */
export const loginRequestSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
