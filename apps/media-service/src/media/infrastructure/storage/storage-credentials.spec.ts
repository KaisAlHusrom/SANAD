import type { ClientProxy } from '@nestjs/microservices';
import type { ResolvedIntegrationConfig } from '@sanad/contracts';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { MediaEnv } from '../../../env.js';
import { resolveActiveStorageConfig } from './storage-credentials.js';

/** A fake settings ClientProxy replying to `settings.integration.resolve`. */
function settingsClient(
  reply: ResolvedIntegrationConfig | null,
  opts: { unreachable?: boolean } = {},
): ClientProxy {
  return {
    send: () =>
      opts.unreachable
        ? throwError(() => new Error('no settings responder'))
        : of(reply),
  } as unknown as ClientProxy;
}

const FULL_ENV = {
  R2_ACCOUNT_ID: 'env-acct',
  R2_ACCESS_KEY_ID: 'env-ak',
  R2_SECRET_ACCESS_KEY: 'env-sk',
  R2_BUCKET: 'env-bucket',
  R2_ENDPOINT: 'https://env.r2',
  R2_PUBLIC_URL: 'https://env.cdn',
} as MediaEnv;

const VAULT_ALL: ResolvedIntegrationConfig = {
  provider: 'r2',
  values: {
    accountId: 'v-acct',
    accessKeyId: 'v-ak',
    secretAccessKey: 'v-sk',
    bucket: 'v-bucket',
    endpoint: 'https://v.r2',
    publicUrl: 'https://v.cdn',
  },
};

describe('resolveActiveStorageConfig (active provider; vault → env → null)', () => {
  it('uses the active provider and prefers its vault values over env', async () => {
    const resolved = await resolveActiveStorageConfig(
      settingsClient(VAULT_ALL),
      FULL_ENV,
    );
    expect(resolved?.provider).toBe('r2');
    expect(resolved?.credentials).toEqual({
      accountId: 'v-acct',
      accessKeyId: 'v-ak',
      secretAccessKey: 'v-sk',
      bucket: 'v-bucket',
      endpoint: 'https://v.r2',
      publicUrl: 'https://v.cdn',
    });
  });

  it('merges per FIELD — a vault secret with the rest from env', async () => {
    const resolved = await resolveActiveStorageConfig(
      settingsClient({ provider: 'r2', values: { secretAccessKey: 'v-sk' } }),
      FULL_ENV,
    );
    expect(resolved?.credentials.secretAccessKey).toBe('v-sk');
    expect(resolved?.credentials.bucket).toBe('env-bucket');
  });

  it('falls back entirely to env when nothing is configured in the admin', async () => {
    const resolved = await resolveActiveStorageConfig(
      settingsClient(null),
      FULL_ENV,
    );
    expect(resolved?.provider).toBe('r2');
    expect(resolved?.credentials.accessKeyId).toBe('env-ak');
  });

  it('falls back to env when the settings service is unreachable', async () => {
    const resolved = await resolveActiveStorageConfig(
      settingsClient(null, { unreachable: true }),
      FULL_ENV,
    );
    expect(resolved?.credentials.bucket).toBe('env-bucket');
  });

  it('returns null when a REQUIRED field is missing on both vault and env', async () => {
    const partialEnv = { ...FULL_ENV, R2_PUBLIC_URL: undefined } as MediaEnv;
    expect(
      await resolveActiveStorageConfig(settingsClient(null), partialEnv),
    ).toBeNull();
  });

  it('can resolve a NAMED provider (what Test connection needs pre-activation)', async () => {
    const resolved = await resolveActiveStorageConfig(
      settingsClient(VAULT_ALL),
      FULL_ENV,
      'r2',
    );
    expect(resolved?.provider).toBe('r2');
  });
});
