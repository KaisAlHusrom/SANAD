import { z } from 'zod';
import { settingScopeSchema } from './setting-type.zod.types.js';

/**
 * The `settings.changed` event payload (MS3 Outbox) — one event per touched group. Zod-first
 * (U16) so a future consumer runtime-validates the inbound broker message. `scopeId` names the
 * client whose override moved (`null` for a global write), without which a consumer could only
 * drop every cached scope instead of the one that changed.
 */
export const settingsChangedEventSchema = z
  .object({
    group: z.string().min(1),
    scope: settingScopeSchema,
    scopeId: z.string().min(1).nullable(),
  })
  .strict();

export type SettingsChangedEvent = z.infer<typeof settingsChangedEventSchema>;
