import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/**
 * A resolved/settable setting value crossing the API boundary: a scalar, a localized
 * `{ ar, en }` object (for `localized_text` keys), or `null` (cleared / unset). The
 * settings-service validates each value against its descriptor `type` on write (N7).
 */
export const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  localizedTextSchema,
  z.null(),
]);
export type SettingValue = z.infer<typeof settingValueSchema>;

/** One key→value write. */
export const settingWriteSchema = z
  .object({
    key: z.string().min(1),
    value: settingValueSchema,
  })
  .strict();
export type SettingWrite = z.infer<typeof settingWriteSchema>;

/**
 * The generic batch settings update (the admin's per-section Save sends only the section's
 * changed keys). Validated at the gateway; per-descriptor type-checking happens in the
 * settings-service `SettingsWriter` (U16, N7).
 */
export const settingsUpdateRequestSchema = z
  .object({
    values: z.array(settingWriteSchema).min(1),
  })
  .strict();
export type SettingsUpdateRequest = z.infer<typeof settingsUpdateRequestSchema>;
