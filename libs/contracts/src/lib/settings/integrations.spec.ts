import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_CATALOG,
  INTEGRATION_CAPABILITIES,
  getProviderDescriptor,
  integrationCapabilitySchema,
  integrationProviderIdSchema,
  listProviders,
  requiredFieldKeys,
  secretFieldKeys,
} from './integration-catalog.js';
import {
  INTEGRATION_PERMISSIONS,
  integrationManagePermission,
} from './permission.js';
import {
  SETTINGS_INTEGRATION_ACTIVATE,
  SETTINGS_INTEGRATION_CONFIGURE,
  SETTINGS_INTEGRATION_RESOLVE,
  SETTINGS_INTEGRATION_STATUS,
} from './message-pattern.js';
import {
  integrationActivatePayloadSchema,
  integrationConfigurePayloadSchema,
  integrationConfigureRequestSchema,
  integrationResolvePayloadSchema,
} from './integration.zod.types.js';

describe('integration catalog (capability → providers → fields)', () => {
  it('enumerates the shipped capabilities and providers', () => {
    expect(integrationCapabilitySchema.options).toEqual(['storage', 'email']);
    expect(integrationProviderIdSchema.options).toEqual(['r2', 'smtp']);
    expect(INTEGRATION_CAPABILITIES).toEqual(['storage', 'email']);
    expect(listProviders('storage').map((p) => p.id)).toEqual(['r2']);
    expect(listProviders('email').map((p) => p.id)).toEqual(['smtp']);
  });

  it('groups every provider under exactly its own capability', () => {
    for (const capability of INTEGRATION_CAPABILITIES) {
      for (const provider of INTEGRATION_CATALOG[capability]) {
        expect(provider.capability).toBe(capability);
        expect(provider.fields.length).toBeGreaterThan(0);
      }
    }
  });

  it('describes R2 with its six fields — only the secret key is secret', () => {
    const r2 = getProviderDescriptor('storage', 'r2');
    expect(r2?.fields.map((f) => f.key)).toEqual([
      'accountId',
      'bucket',
      'accessKeyId',
      'secretAccessKey',
      'endpoint',
      'publicUrl',
    ]);
    expect(secretFieldKeys('storage', 'r2')).toEqual(['secretAccessKey']);
    // every R2 field falls back to the media-service env name it already uses
    expect(
      Object.fromEntries(r2!.fields.map((f) => [f.key, f.envVar])),
    ).toEqual({
      accountId: 'R2_ACCOUNT_ID',
      bucket: 'R2_BUCKET',
      accessKeyId: 'R2_ACCESS_KEY_ID',
      secretAccessKey: 'R2_SECRET_ACCESS_KEY',
      endpoint: 'R2_ENDPOINT',
      publicUrl: 'R2_PUBLIC_URL',
    });
    expect(requiredFieldKeys('storage', 'r2')).toHaveLength(6);
  });

  it('describes SMTP with the FULL connection set, not just the password', () => {
    const smtp = getProviderDescriptor('email', 'smtp');
    expect(smtp?.fields.map((f) => f.key)).toEqual([
      'host',
      'port',
      'secure',
      'user',
      'password',
      'from',
    ]);
    expect(secretFieldKeys('email', 'smtp')).toEqual(['password']);
    expect(
      Object.fromEntries(smtp!.fields.map((f) => [f.key, f.envVar])),
    ).toEqual({
      host: 'SMTP_HOST',
      port: 'SMTP_PORT',
      secure: 'SMTP_SECURE',
      user: 'SMTP_USER',
      password: 'SMTP_PASSWORD',
      from: 'SMTP_FROM',
    });
    // auth is optional (some relays are open); host/port/from are what make it usable
    expect(requiredFieldKeys('email', 'smtp')).toEqual([
      'host',
      'port',
      'from',
    ]);
    expect(smtp?.fields.find((f) => f.key === 'port')?.type).toBe('number');
    expect(smtp?.fields.find((f) => f.key === 'secure')?.type).toBe('boolean');
  });

  it('returns undefined for a provider that does not belong to the capability', () => {
    expect(getProviderDescriptor('storage', 'smtp')).toBeUndefined();
    expect(getProviderDescriptor('email', 'r2')).toBeUndefined();
  });

  it('gates each capability with its own manage permission', () => {
    expect(INTEGRATION_PERMISSIONS.read).toBe('settings.integrations.read');
    expect(integrationManagePermission('storage')).toBe(
      'settings.integrations.storage.manage',
    );
    expect(integrationManagePermission('email')).toBe(
      'settings.integrations.email.manage',
    );
  });

  it('exposes stable message patterns', () => {
    expect(SETTINGS_INTEGRATION_STATUS).toBe('settings.integration.status');
    expect(SETTINGS_INTEGRATION_CONFIGURE).toBe(
      'settings.integration.configure',
    );
    expect(SETTINGS_INTEGRATION_ACTIVATE).toBe('settings.integration.activate');
    expect(SETTINGS_INTEGRATION_RESOLVE).toBe('settings.integration.resolve');
  });

  it('validates the configure/activate/resolve payloads strictly (N7)', () => {
    expect(
      integrationConfigureRequestSchema.safeParse({
        values: { bucket: 'b', secretAccessKey: null },
      }).success,
    ).toBe(true);
    expect(
      integrationConfigureRequestSchema.safeParse({ values: {}, extra: 1 })
        .success,
    ).toBe(false);

    expect(
      integrationConfigurePayloadSchema.safeParse({
        capability: 'storage',
        provider: 'r2',
        values: { bucket: 'b' },
      }).success,
    ).toBe(true);
    expect(
      integrationConfigurePayloadSchema.safeParse({
        capability: 'nope',
        provider: 'r2',
        values: {},
      }).success,
    ).toBe(false);

    expect(
      integrationActivatePayloadSchema.safeParse({
        capability: 'email',
        provider: 'smtp',
      }).success,
    ).toBe(true);

    // resolve may target the ACTIVE provider (no provider) or a specific one (for Test)
    expect(
      integrationResolvePayloadSchema.safeParse({ capability: 'storage' })
        .success,
    ).toBe(true);
    expect(
      integrationResolvePayloadSchema.safeParse({
        capability: 'storage',
        provider: 'r2',
      }).success,
    ).toBe(true);
  });
});
