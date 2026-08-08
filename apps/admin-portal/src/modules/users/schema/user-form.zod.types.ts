import { z } from 'zod';

/**
 * The create-user form shape (F6). Mirrors `userCreateSchema` minus the server defaults:
 * password is required (min 8), roles are the keys chosen in the multi-select. Strict-ish —
 * the gateway re-validates against the contract (U16).
 */
export const userCreateFormSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  isActive: z.boolean(),
  roles: z.array(z.string()),
});

export type UserCreateFormValues = z.infer<typeof userCreateFormSchema>;

/**
 * The edit-user form shape — profile only (name, email, active state). Roles are managed in
 * the dedicated roles modal; password reset is out of scope (P7.D).
 */
export const userEditFormSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  isActive: z.boolean(),
});

export type UserEditFormValues = z.infer<typeof userEditFormSchema>;
