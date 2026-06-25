import { z } from 'zod';
import { roleSchema } from './role.js';

/**
 * The authenticated identity the gateway validates once (from the JWT) and
 * forwards to services in RMQ headers. Services trust this, they don't re-decode.
 * Lives in `@sanad/contracts` (the single source, U3) so both the NestJS backend
 * (via `@sanad/auth`) and the browser portals can validate it without dragging in
 * the framework adapters.
 */
export const identityContextSchema = z
  .object({
    userId: z.string().min(1),
    roles: z.array(roleSchema).min(1),
    /**
     * Resolved permission keys (`<resource>.<action>`, plus `manage` wildcards).
     * Defaults to empty so older callers/tokens without the claim still parse;
     * authorization then simply denies (fail-closed).
     */
    permissions: z.array(z.string()).default([]),
    email: z.string().email().optional(),
  })
  .strict();

export type IdentityContext = z.infer<typeof identityContextSchema>;
