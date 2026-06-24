import {
  BRANDING_FIELDS,
  BRANDING_GROUP,
  SETTINGS_DEFAULTS,
} from '../settings/application/branding-catalog.js';
import { isLocalizedText } from '../settings/application/resolved-value.js';
import type { SettingCatalogInput } from '../settings/infrastructure/setting.repository.js';
import type { SettingScalar } from '../db/schema/index.js';

/**
 * The settings catalog seeded into the settings DB — one descriptor row per branding
 * leaf (derived from `BRANDING_FIELDS`, the single source). Seeds **catalog rows only**,
 * never `setting_value` rows: an unset value resolves to the coded default (the P3
 * acceptance). `localized_text` defaults aren't stored as a scalar `defaultValue`.
 */
export const SETTINGS_CATALOG: readonly SettingCatalogInput[] =
  BRANDING_FIELDS.map((field) => {
    const coded = SETTINGS_DEFAULTS[field.key] ?? null;
    // localized defaults aren't stored as a scalar catalog `defaultValue`.
    const defaultValue: SettingScalar | null = isLocalizedText(coded)
      ? null
      : coded;
    return {
      key: field.key,
      group: BRANDING_GROUP,
      type: field.type,
      requirement: 'optional',
      scope: 'global',
      defaultValue,
    };
  });
