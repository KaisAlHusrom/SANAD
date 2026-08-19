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
import {
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  RATE_LIMIT_LIMIT_BOUNDS,
  RATE_LIMIT_WINDOW_BOUNDS,
  SECURITY_GROUP,
  SECURITY_SECTION_RATE_LIMIT,
  SECURITY_SETTING_KEYS,
  rateLimitPolicyIdSchema,
} from './security-settings.js';

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

describe('security settings contracts (P8.10.A)', () => {
  it('names the group and its rate-limit policies', () => {
    expect(SECURITY_GROUP).toBe('security');
    expect(SECURITY_SECTION_RATE_LIMIT).toBe('rateLimit');
    expect(rateLimitPolicyIdSchema.options).toEqual([
      'auth',
      'lead',
      'default',
      'none',
    ]);
    expect(rateLimitPolicyIdSchema.safeParse('admin').success).toBe(false);
  });

  it('keys every setting under the group and never repeats one', () => {
    const keys = Object.values(SECURITY_SETTING_KEYS);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key.startsWith('security.rateLimit.')).toBe(true);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('carries the coded defaults the gateway falls back to (U9)', () => {
    expect(RATE_LIMIT_DEFAULTS.auth).toEqual({ limit: 10, windowSeconds: 300 });
    expect(RATE_LIMIT_DEFAULTS.lead).toEqual({
      limit: 20,
      windowSeconds: 3600,
    });
    expect(RATE_LIMIT_DEFAULTS.default).toEqual({
      limit: 300,
      windowSeconds: 60,
    });
    expect(RATE_LIMIT_ENABLED_DEFAULT).toBe(true);
  });

  // `none` is the exemption marker, not a bucket — it must never carry numbers a
  // resolver could try to clamp.
  it('has no policy numbers for the exemption marker', () => {
    expect('none' in RATE_LIMIT_DEFAULTS).toBe(false);
  });

  it('keeps every coded default inside the bounds the gateway clamps to', () => {
    for (const policy of Object.values(RATE_LIMIT_DEFAULTS)) {
      expect(policy.limit).toBeGreaterThanOrEqual(RATE_LIMIT_LIMIT_BOUNDS.min);
      expect(policy.limit).toBeLessThanOrEqual(RATE_LIMIT_LIMIT_BOUNDS.max);
      expect(policy.windowSeconds).toBeGreaterThanOrEqual(
        RATE_LIMIT_WINDOW_BOUNDS.min,
      );
      expect(policy.windowSeconds).toBeLessThanOrEqual(
        RATE_LIMIT_WINDOW_BOUNDS.max,
      );
    }
  });
});
