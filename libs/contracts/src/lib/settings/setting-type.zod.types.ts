import { z } from 'zod';

/**
 * The kind of a setting's value — drives how the resolver parses/serializes it and
 * how the admin editor renders the field. Runtime-validated (settings catalog) → a
 * `.zod.types` file (U16). Mirrored by a Postgres enum in the settings-service schema.
 */
export const settingTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'color',
  'url',
  'image',
  'select',
  'localized_text',
]);

export type SettingType = z.infer<typeof settingTypeSchema>;

/** Whether a setting must have a resolved value. */
export const settingRequirementSchema = z.enum(['required', 'optional']);

export type SettingRequirement = z.infer<typeof settingRequirementSchema>;

/**
 * The scope a value is set at. `global` is the single platform-wide value;
 * `client` is a per-client override (wired but dormant in the MVP — only `global`
 * is populated until the client portal exists).
 */
export const settingScopeSchema = z.enum(['global', 'client']);

export type SettingScope = z.infer<typeof settingScopeSchema>;

/**
 * A resolution context: which scope to resolve at, and (for non-global scopes) the
 * id of the scoped entity. Precedence is always override(scope+scopeId) → global →
 * coded default (U9). `scopeId` is required by the resolver when `scope !== 'global'`.
 */
export const resolveScopeSchema = z
  .object({
    scope: settingScopeSchema.default('global'),
    scopeId: z.string().min(1).optional(),
  })
  .strict();

export type ResolveScope = z.infer<typeof resolveScopeSchema>;
