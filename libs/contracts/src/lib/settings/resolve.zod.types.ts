import { z } from 'zod';
import { resolveScopeSchema } from './setting-type.zod.types.js';

/**
 * Resolve a single setting by key at an optional scope (MS2). Strict (N7).
 * The reply is the resolved value (shape depends on the setting's type).
 */
export const resolveRequestSchema = z
  .object({
    key: z.string().min(1),
  })
  .merge(resolveScopeSchema)
  .strict();

export type ResolveRequest = z.infer<typeof resolveRequestSchema>;

/** Resolve a whole settings group (e.g. `branding`) at an optional scope (MS2). */
export const resolveGroupRequestSchema = z
  .object({
    group: z.string().min(1),
  })
  .merge(resolveScopeSchema)
  .strict();

export type ResolveGroupRequest = z.infer<typeof resolveGroupRequestSchema>;
