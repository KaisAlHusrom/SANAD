import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Postgres enums mirroring the contract unions (`@sanad/contracts`). Kept here so the
 * migrations create the types in this service's own DB (MS5). Values MUST match the
 * Zod enums (`settingTypeSchema` / `settingRequirementSchema` / `settingScopeSchema`).
 */
export const settingTypeEnum = pgEnum('setting_type', [
  'text',
  'number',
  'boolean',
  'color',
  'url',
  'image',
  'select',
  'localized_text',
]);

export const settingRequirementEnum = pgEnum('setting_requirement', [
  'required',
  'optional',
]);

export const settingScopeEnum = pgEnum('setting_scope', ['global', 'client']);
