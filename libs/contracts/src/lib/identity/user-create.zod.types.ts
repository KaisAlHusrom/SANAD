import { z } from 'zod';
import { roleSchema } from './role.js';

/**
 * Create a user (admin, `identity.users.manage`). The password is hashed server-side (never
 * stored or echoed). `roles` are assigned in the same transaction as the insert. Strict (N7);
 * `.zod.types` (U16). Idempotent-safe: defaults + `toLowerCase` survive the gateway→service
 * re-validation (MS4).
 */
export const userCreateSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    name: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(128),
    isActive: z.boolean().default(true),
    roles: z.array(roleSchema).default([]),
  })
  .strict();

export type UserCreateRequest = z.infer<typeof userCreateSchema>;
