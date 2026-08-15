import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `auth.loggedIn` — A staff user signed in; the session and its permissions are now established. */
export const authLoggedInEvent = {
  name: 'auth.loggedIn',
  transport: 'client-bus',
  payloadSchema: z.object({ userId: z.string().uuid() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/auth/api/auth.api.ts',
  description:
    'A staff user signed in; the session and its permissions are now established.',
  consumers: [],
  orphanReason:
    'The login mutation already seeds the auth slice and the guarded shell mounts from it, so ' +
    'nothing else reacts today. Kept as the canonical session-start signal for P8.11 (identity ' +
    'completion), whose session/device list must record a new session as it opens.',
} as const satisfies EventDefinition;
