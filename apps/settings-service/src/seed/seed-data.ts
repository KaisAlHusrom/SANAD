import {
  BRANDING_FIELDS,
  BRANDING_GROUP,
} from '../settings/application/branding-catalog.js';
import {
  SECURITY_FIELDS,
  SECURITY_GROUP,
} from '../settings/application/security-catalog/index.js';
import {
  TRACKING_FIELDS,
  TRACKING_GROUP,
} from '../settings/application/tracking-catalog/index.js';
import { SETTINGS_DEFAULTS } from '../settings/application/settings-defaults/index.js';
import { isLocalizedText } from '../settings/application/resolved-value.js';
import type { SettingCatalogInput } from '../settings/infrastructure/setting.repository.js';
import type { SettingType } from '@sanad/contracts';
import type { SettingScalar } from '../db/schema/index.js';

/** One catalog row per declared field of a group. */
function catalogRows(
  fields: readonly { key: string; type: SettingType }[],
  group: string,
): SettingCatalogInput[] {
  return fields.map((field) => {
    const coded = SETTINGS_DEFAULTS[field.key] ?? null;
    // localized defaults aren't stored as a scalar catalog `defaultValue`.
    const defaultValue: SettingScalar | null = isLocalizedText(coded)
      ? null
      : coded;
    return {
      key: field.key,
      group,
      type: field.type,
      requirement: 'optional',
      scope: 'global',
      defaultValue,
    };
  });
}

/**
 * The settings catalog seeded into the settings DB — one descriptor row per declared field
 * (derived from each group's field list, the single source). Seeds **catalog rows only**,
 * never `setting_value` rows: an unset value resolves to the coded default (the P3
 * acceptance). `localized_text` defaults aren't stored as a scalar `defaultValue`.
 *
 * Applied idempotently at boot by `SeedService` → `ensureSetting`, so a new group needs no
 * migration: the rows appear on the next start.
 */
export const SETTINGS_CATALOG: readonly SettingCatalogInput[] = [
  ...catalogRows(BRANDING_FIELDS, BRANDING_GROUP),
  ...catalogRows(SECURITY_FIELDS, SECURITY_GROUP),
  ...catalogRows(TRACKING_FIELDS, TRACKING_GROUP),
];
