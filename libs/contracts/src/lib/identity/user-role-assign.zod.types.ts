import { z } from 'zod';
import { roleSchema } from './role.js';

/**
 * Assign or revoke a role for a user (admin, `identity.users.manage`). The same shape backs
 * both `IDENTITY_USERS_ROLE_ASSIGN` and `IDENTITY_USERS_ROLE_REVOKE`. Strict (N7);
 * `.zod.types` (U16).
 */
export const userRoleAssignSchema = z
  .object({
    userId: z.string().uuid(),
    role: roleSchema,
  })
  .strict();

export type UserRoleAssignRequest = z.infer<typeof userRoleAssignSchema>;
