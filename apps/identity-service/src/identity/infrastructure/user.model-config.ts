import type { ModelConfig } from '@sanad/database';
import { userTable } from '../../db/schema/index.js';

/**
 * The user model config (N1). `password` is hidden from output (N2); only profile
 * fields are mass-assignable — the argon2 hash is set explicitly on registration/seed,
 * never via a mass-assigned create. Soft-deletes are on.
 */
export const userModelConfig: ModelConfig<typeof userTable> = {
  table: userTable,
  hidden: ['password'],
  fillable: ['email', 'name', 'isActive'],
  softDeletes: true,
};
