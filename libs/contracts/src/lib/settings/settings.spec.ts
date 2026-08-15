import { describe, expect, it } from 'vitest';
import {
  settingTypeSchema,
  settingScopeSchema,
  resolveScopeSchema,
} from './setting-type.zod.types.js';
import { resolveRequestSchema } from './resolve.zod.types.js';
import { brandingUpdateRequestSchema } from './branding-update.zod.types.js';
import { SETTINGS_PERMISSIONS } from './permission.js';
import {
  SETTINGS_BRANDING_GET,
  SETTINGS_CHANGED_EVENT,
  SETTINGS_RESOLVE,
} from './message-pattern.js';
import { settingsChangedEventSchema } from './settings-event.zod.types.js';

describe('settings contracts', () => {
  it('enumerates setting types and scopes', () => {
    expect(settingTypeSchema.safeParse('localized_text').success).toBe(true);
    expect(settingTypeSchema.safeParse('bogus').success).toBe(false);
    expect(settingScopeSchema.options).toEqual(['global', 'client']);
  });

  it('defaults the resolve scope to global', () => {
    const parsed = resolveScopeSchema.parse({});
    expect(parsed.scope).toBe('global');
  });

  it('validates a resolve request and rejects unknown keys (strict, N7)', () => {
    expect(
      resolveRequestSchema.safeParse({ key: 'branding.colors.primary' })
        .success,
    ).toBe(true);
    expect(
      resolveRequestSchema.safeParse({
        key: 'x',
        scope: 'client',
        scopeId: 'c1',
      }).success,
    ).toBe(true);
    expect(resolveRequestSchema.safeParse({ key: '' }).success).toBe(false);
    expect(resolveRequestSchema.safeParse({ key: 'x', extra: 1 }).success).toBe(
      false,
    );
  });

  it('accepts a deep-partial branding update and validates leaf shapes', () => {
    expect(
      brandingUpdateRequestSchema.safeParse({ colors: { primary: '#ff0000' } })
        .success,
    ).toBe(true);
    expect(
      brandingUpdateRequestSchema.safeParse({
        brand: { name: { ar: 'سند', en: 'Sanad' } },
        social: { twitter: null },
        contact: { email: 'hi@sanad.tech' },
      }).success,
    ).toBe(true);
    // bad hex color
    expect(
      brandingUpdateRequestSchema.safeParse({ colors: { primary: 'red' } })
        .success,
    ).toBe(false);
    // unknown key rejected (strict)
    expect(brandingUpdateRequestSchema.safeParse({ nope: true }).success).toBe(
      false,
    );
    // bad email
    expect(
      brandingUpdateRequestSchema.safeParse({ contact: { email: 'x' } })
        .success,
    ).toBe(false);
  });

  it('exposes the manage permission and stable patterns', () => {
    expect(SETTINGS_PERMISSIONS.manage).toBe('settings.manage');
    expect(SETTINGS_BRANDING_GET).toBe('settings.branding.get');
    expect(SETTINGS_RESOLVE).toBe('settings.resolve');
  });

  it('validates the settings.changed event payload, scopeId included (U27)', () => {
    expect(SETTINGS_CHANGED_EVENT).toBe('settings.changed');
    expect(
      settingsChangedEventSchema.safeParse({
        group: 'branding',
        scope: 'global',
        scopeId: null,
      }).success,
    ).toBe(true);
    expect(
      settingsChangedEventSchema.safeParse({
        group: 'branding',
        scope: 'client',
        scopeId: 'acme',
      }).success,
    ).toBe(true);
    // scopeId is required — a consumer that cannot tell WHICH scope moved would have to
    // drop every cached scope.
    expect(
      settingsChangedEventSchema.safeParse({
        group: 'branding',
        scope: 'global',
      }).success,
    ).toBe(false);
    expect(
      settingsChangedEventSchema.safeParse({
        group: 'branding',
        scope: 'nowhere',
        scopeId: null,
      }).success,
    ).toBe(false);
  });
});
