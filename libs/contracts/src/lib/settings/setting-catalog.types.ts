import type {
  SettingRequirement,
  SettingType,
} from './setting-type.zod.types.js';
import type { SettingValue } from './settings-update.zod.types.js';

/**
 * The descriptor-driven settings catalog returned to the admin (response DTO, not
 * runtime-validated → `.types.ts`, U16). Structure (groups → sections → fields) comes
 * from the settings-service catalog; each field carries its descriptor (type/requirement/
 * options) plus the current **resolved** value (override → global → coded default, U9).
 * The admin renders group = rail tab, section = sub-tab, field = a typed control.
 */
export interface SettingField {
  /** The flat dot-notation setting key (e.g. `branding.colors.primary`). */
  key: string;
  type: SettingType;
  requirement: SettingRequirement;
  /** Allowed values for `select`-typed fields. */
  options?: readonly string[];
  /** Inclusive range for `number`-typed fields — enforced on write, and on the control. */
  min?: number;
  max?: number;
  /**
   * A shape a string-typed value must match — enforced on write, and surfaced on the control.
   * The same generic capability `min`/`max` are; a value that cannot be right must be refused
   * at the moment it is typed, not accepted and reported back as "saved" (U0).
   */
  pattern?: string;
  /** A valid example of `pattern`, shown as the field's placeholder and in the rejection. */
  patternExample?: string;
  /** The current resolved value (never blank — coded default when unset, F7). */
  value: SettingValue;
}

export interface SettingSection {
  /** Stable section id (e.g. `colors`); the admin maps it to an i18n label. */
  section: string;
  fields: readonly SettingField[];
}

export interface SettingGroup {
  /** Stable group id (e.g. `branding`); the admin maps it to an i18n label. */
  group: string;
  sections: readonly SettingSection[];
}

export interface SettingsCatalog {
  groups: readonly SettingGroup[];
}
