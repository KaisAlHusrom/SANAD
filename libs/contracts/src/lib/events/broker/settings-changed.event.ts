import { SETTINGS_CHANGED_EVENT } from '../../settings/message-pattern.js';
import { settingsChangedEventSchema } from '../../settings/settings-event.zod.types.js';
import type { EventDefinition } from '../event-definition.types.js';

/**
 * `settings.changed` — one event per touched settings group, enqueued in the same transaction
 * as the value writes (MS3). ORPHAN by declaration (U27d), not by accident.
 */
export const settingsChangedEvent = {
  name: SETTINGS_CHANGED_EVENT,
  transport: 'broker',
  payloadSchema: settingsChangedEventSchema,
  producer: 'settings-service',
  producedAt:
    'apps/settings-service/src/settings/application/settings/settings.writer.ts',
  description:
    'A settings group was written at a scope; every cached read of that group is now stale.',
  consumers: [],
  orphanReason:
    'P8.12 (notifications completion) owns the first consumer: the notifications service caches the ' +
    'branding + template snapshot it renders mail from and must drop it when the `branding` or ' +
    '`notifications` group changes. The website ISR revalidation hook is P8.23. Emitting ahead of ' +
    'the consumer is deliberate — the producer is already transactional (MS3), so wiring a consumer ' +
    'later is a pure addition with no producer change.',
} as const satisfies EventDefinition;
