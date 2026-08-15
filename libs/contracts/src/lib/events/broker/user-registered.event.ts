import { USER_REGISTERED_EVENT } from '../../identity/message-pattern.js';
import { userRegisteredEventSchema } from '../../identity/user-event.zod.types.js';
import type { EventDefinition } from '../event-definition.types.js';

/**
 * `user.registered` — a user account first exists. Today the only producer is the idempotent
 * admin seeder; P8.11 (identity completion) adds invitation + self-registration producers.
 * ORPHAN by declaration (U27d), not by accident.
 */
export const userRegisteredEvent = {
  name: USER_REGISTERED_EVENT,
  transport: 'broker',
  payloadSchema: userRegisteredEventSchema,
  producer: 'identity-service',
  producedAt: 'apps/identity-service/src/seed/seed.service.ts',
  description:
    'A user account was created and can now be greeted, verified and onboarded.',
  consumers: [],
  orphanReason:
    'P8.12 (notifications completion) owns the consumer — the welcome + verify email, which needs ' +
    'the DB-backed template system that phase builds; P8.11 adds the real registration producers ' +
    '(invitation, verification) alongside it. Emitting from the seeder today keeps the contract ' +
    'exercised end to end so the consumer is a pure addition.',
} as const satisfies EventDefinition;
