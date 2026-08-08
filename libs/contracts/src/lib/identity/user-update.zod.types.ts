import { z } from 'zod';

/**
 * Update a user's profile (admin, `identity.users.manage`): name, email, and active state.
 * Password reset is out of scope for P7.D (a separate request later). Strict (N7);
 * `.zod.types` (U16).
 */
export const userUpdateSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().toLowerCase().email().max(320).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UserUpdateRequest = z.infer<typeof userUpdateSchema>;
