import { describe, expect, it } from 'vitest';
import {
  settingTypeSchema,
  settingScopeSchema,
  resolveScopeSchema,
} from './setting-type.zod.types.js';
import { resolveRequestSchema } from './resolve.zod.types.js';
import { brandingUpdateRequestSchema } from './branding-update.zod.types.js';
import {
  SETTINGS_PERMISSIONS,
  SECRET_PERMISSIONS,
  secretManagePermission,
} from './permission.js';
import {
  SETTINGS_BRANDING_GET,
  SETTINGS_RESOLVE,
  SETTINGS_RESOLVE_SECRET,
  SETTINGS_SECRET_SET,
  SETTINGS_SECRET_STATUS,
} from './message-pattern.js';
import {
  secretKeySchema,
  SECRET_REGISTRY,
  SECRET_REGISTRY_LIST,
} from './secret-key.zod.types.js';
import { setSecretRequestSchema } from './set-secret.zod.types.js';
import {
  secretResolvePayloadSchema,
  secretSetPayloadSchema,
} from './integration-secret.zod.types.js';

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

  it('defines the integration-secret vault contracts (N13)', () => {
    // stable patterns
    expect(SETTINGS_RESOLVE_SECRET).toBe('settings.resolve-secret');
    expect(SETTINGS_SECRET_SET).toBe('settings.integration-secret.set');
    expect(SETTINGS_SECRET_STATUS).toBe('settings.integration-secret.status');

    // only registered keys SANAD actually has (U15)
    expect(secretKeySchema.safeParse('SMTP_PASSWORD').success).toBe(true);
    expect(secretKeySchema.safeParse('GEMINI_API_KEY').success).toBe(false);
    expect(SECRET_REGISTRY.SMTP_PASSWORD.wired).toBe(true);
    expect(SECRET_REGISTRY_LIST.length).toBe(2);

    // set-secret body: non-empty value, strict
    expect(setSecretRequestSchema.safeParse({ value: 'abc' }).success).toBe(
      true,
    );
    expect(setSecretRequestSchema.safeParse({ value: '' }).success).toBe(false);
    expect(
      setSecretRequestSchema.safeParse({ value: 'a', extra: 1 }).success,
    ).toBe(false);

    // RMQ payloads
    expect(
      secretResolvePayloadSchema.safeParse({ key: 'SMTP_PASSWORD' }).success,
    ).toBe(true);
    expect(secretResolvePayloadSchema.safeParse({ key: 'nope' }).success).toBe(
      false,
    );
    expect(
      secretSetPayloadSchema.safeParse({ key: 'SMTP_PASSWORD', value: 'pw' })
        .success,
    ).toBe(true);
    expect(
      secretSetPayloadSchema.safeParse({ key: 'SMTP_PASSWORD', value: '' })
        .success,
    ).toBe(false);
  });

  it('gates the vault per integration (N13 — each third party owns its permission)', () => {
    // a page-level read permission, distinct from settings.manage
    expect(SECRET_PERMISSIONS.read).toBe('settings.secrets.read');
    expect(SECRET_PERMISSIONS.read).not.toBe(SETTINGS_PERMISSIONS.manage);

    // per-feature manage keys derived from the feature
    expect(secretManagePermission('email')).toBe(
      'settings.secrets.email.manage',
    );
    expect(secretManagePermission('storage')).toBe(
      'settings.secrets.storage.manage',
    );

    // every registry entry carries the manage permission for its feature
    expect(SECRET_REGISTRY.SMTP_PASSWORD.managePermission).toBe(
      'settings.secrets.email.manage',
    );
    expect(SECRET_REGISTRY.R2_SECRET_KEY.managePermission).toBe(
      'settings.secrets.storage.manage',
    );
    for (const entry of SECRET_REGISTRY_LIST) {
      expect(entry.managePermission).toBe(
        secretManagePermission(entry.feature),
      );
    }
  });
});
