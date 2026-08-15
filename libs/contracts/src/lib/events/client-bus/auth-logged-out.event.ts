import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `auth.loggedOut` — A staff user signed out; every cached, permission-scoped read is now suspect. */
export const authLoggedOutEvent = {
  name: 'auth.loggedOut',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/auth/api/auth.api.ts',
  description:
    'A staff user signed out; every cached, permission-scoped read is now suspect.',
  consumers: [],
  orphanReason:
    'The auth slice reset plus the router remount already clear everything a subscriber would, so ' +
    'nothing reacts today. Kept as the canonical session signal for P8.11 (identity completion), ' +
    'which adds the session/device list and revoke-all that must react to a sign-out.',
} as const satisfies EventDefinition;
