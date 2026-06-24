import { z } from 'zod';

/**
 * Refresh request body. The real path is `POST /auth/refresh { refresh }` — the
 * frontend client matches this exact shape (F1). Strict (N7); runtime-validated (U16).
 */
export const refreshRequestSchema = z
  .object({
    refresh: z.string().min(1),
  })
  .strict();

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
