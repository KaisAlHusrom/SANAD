import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { RpcException } from '@nestjs/microservices';
import { describe, expect, it, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { DateTimeService, failIfDbTestsRequired } from '@sanad/database';
import { schema, type SettingsDb } from '../../db/schema/index.js';
import type { SettingsEnv } from '../../env.js';
import { SecretCipherService } from '../application/crypto/secret-cipher.service.js';
import { IntegrationsService } from '../application/integrations.service.js';
import { IntegrationActiveProviderRepository } from './integration-active-provider.repository.js';
import { IntegrationConfigRepository } from './integration-config.repository.js';

// The dedicated test DB (TDD2) — created by infra/postgres/init/01-create-databases.sql.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/settings_test';
// Resolve the migrations dir from THIS file, not the CWD — vitest's cwd differs from the
// project root depending on how it is invoked, which silently turned the suite into a skip.
const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);
const KEY = 'c2FuYWQtZGV2LXNlY3JldHMtZW5jcnlwdGlvbi1rZXk='; // base64 of 32 bytes
const USER_1 = '11111111-1111-1111-1111-111111111111';

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    return pool;
  } catch (error) {
    // Report WHY we're skipping — a silent skip hides a real migration failure as "green".
    console.warn(
      `settings_test unavailable (${String(error instanceof Error ? error.message : error)})`,
    );
    await pool.end().catch(() => undefined);
    failIfDbTestsRequired(TEST_DB_URL, error);
    return null;
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'settings_test unreachable — skipping integrations DB tests (TDD2).',
  );
}

/** Assert a call rejects with the U24 shape: an `RpcException` carrying a 400 + a message KEY. */
async function expectRejectionKey(
  run: () => Promise<unknown>,
  messageKey: string,
): Promise<void> {
  try {
    await run();
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(RpcException);
    expect((error as RpcException).getError()).toMatchObject({
      statusCode: 400,
      messageKey,
    });
  }
}

describeDb('integrations vault (capability → providers → active, N13)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (suite skipped) — narrows the type for TS
  }
  const db = drizzle(activePool, { schema }) as SettingsDb;
  const clock = new DateTimeService();
  const configs = new IntegrationConfigRepository(db, clock);
  const actives = new IntegrationActiveProviderRepository(db, clock);
  const cipher = new SecretCipherService({
    APP_SECRETS_ENCRYPTION_KEY: KEY,
  } as SettingsEnv);
  const svc = new IntegrationsService(configs, actives, cipher);

  beforeEach(async () => {
    await activePool.query(
      'truncate table integration_config, integration_active_provider',
    );
  });

  it('stores secrets encrypted + non-secrets in plaintext, and masks the status', async () => {
    await svc.configureProvider(
      'storage',
      'r2',
      {
        accountId: 'acct-1',
        bucket: 'my-bucket',
        accessKeyId: 'AK123',
        secretAccessKey: 'super-secret-value',
        endpoint: 'https://r2.example.com',
        publicUrl: 'https://cdn.example.com',
      },
      USER_1,
    );

    // raw row check: the secret is NOT readable, the non-secret IS
    const rows = await activePool.query(
      `select field_key, value, ciphertext, last4 from integration_config
       where capability='storage' and provider='r2' order by field_key`,
    );
    const byKey = Object.fromEntries(
      rows.rows.map((r: Record<string, unknown>) => [r['field_key'], r]),
    );
    expect(byKey['bucket'].value).toBe('my-bucket');
    expect(byKey['bucket'].ciphertext).toBeNull();
    expect(byKey['secretAccessKey'].value).toBeNull();
    expect(byKey['secretAccessKey'].ciphertext).toBeTruthy();
    expect(byKey['secretAccessKey'].ciphertext).not.toContain('super-secret');
    expect(byKey['secretAccessKey'].last4).toBe('alue');

    // masked status: non-secret values visible, secret only as last4
    const statuses = await svc.getStatuses();
    const storage = statuses.find((s) => s.capability === 'storage');
    const r2 = storage?.providers.find((p) => p.provider === 'r2');
    expect(r2?.configured).toBe(true);
    const field = (key: string) => r2?.fields.find((f) => f.key === key);
    expect(field('bucket')?.value).toBe('my-bucket');
    expect(field('secretAccessKey')?.value).toBeNull();
    expect(field('secretAccessKey')?.last4).toBe('alue');
    expect(field('secretAccessKey')?.isSet).toBe(true);
  });

  it('resolves the decrypted config for a consumer (server-side only)', async () => {
    await svc.configureProvider(
      'storage',
      'r2',
      { bucket: 'b', secretAccessKey: 'plain-secret' },
      USER_1,
    );
    await svc.activateProvider('storage', 'r2', USER_1);

    const resolved = await svc.resolveConfig('storage');
    expect(resolved?.provider).toBe('r2');
    expect(resolved?.values['bucket']).toBe('b');
    expect(resolved?.values['secretAccessKey']).toBe('plain-secret');
  });

  it('leaves an untyped (absent) field untouched so a masked secret survives an edit', async () => {
    await svc.configureProvider(
      'storage',
      'r2',
      { bucket: 'b1', secretAccessKey: 'keep-me' },
      USER_1,
    );
    // the admin re-saves without retyping the secret → key absent from values
    await svc.configureProvider('storage', 'r2', { bucket: 'b2' }, USER_1);

    const resolved = await svc.resolveConfig('storage', 'r2');
    expect(resolved?.values['bucket']).toBe('b2');
    expect(resolved?.values['secretAccessKey']).toBe('keep-me');
  });

  it('clears a field when an empty value is submitted', async () => {
    await svc.configureProvider('storage', 'r2', { bucket: 'b' }, USER_1);
    await svc.configureProvider('storage', 'r2', { bucket: '' }, USER_1);
    const resolved = await svc.resolveConfig('storage', 'r2');
    expect(resolved?.values['bucket']).toBeUndefined();
  });

  it('reports configured=false until every REQUIRED field is present', async () => {
    await svc.configureProvider('email', 'smtp', { host: 'smtp.test' }, USER_1);
    let smtp = (await svc.getStatuses())
      .find((s) => s.capability === 'email')
      ?.providers.find((p) => p.provider === 'smtp');
    expect(smtp?.configured).toBe(false); // port + from still missing

    await svc.configureProvider(
      'email',
      'smtp',
      { port: '587', from: 'Sanad <no-reply@sanad.tech>' },
      USER_1,
    );
    smtp = (await svc.getStatuses())
      .find((s) => s.capability === 'email')
      ?.providers.find((p) => p.provider === 'smtp');
    expect(smtp?.configured).toBe(true); // user/password are optional
  });

  it('activates exactly one provider per capability and reports it', async () => {
    await svc.activateProvider('storage', 'r2', USER_1);
    await svc.activateProvider('storage', 'r2', USER_1); // idempotent re-activate

    const rows = await activePool.query(
      `select count(*)::int as n from integration_active_provider where capability='storage'`,
    );
    expect(rows.rows[0].n).toBe(1);

    const storage = (await svc.getStatuses()).find(
      (s) => s.capability === 'storage',
    );
    expect(storage?.activeProvider).toBe('r2');
  });

  it('rejects a provider that does not belong to the capability, and unknown fields', async () => {
    // Keyed 400s the gateway localizes (U24) — and `RpcException`s, so the 400 survives the
    // broker instead of surfacing as a 500 (the 2026-07-19 bug).
    await expectRejectionKey(
      () => svc.configureProvider('storage', 'smtp', { host: 'x' }, USER_1),
      'settings.unknownProvider',
    );
    await expectRejectionKey(
      () => svc.configureProvider('storage', 'r2', { nope: 'x' }, USER_1),
      'settings.unknownField',
    );
    await expectRejectionKey(
      () => svc.activateProvider('email', 'r2', USER_1),
      'settings.unknownProvider',
    );
  });

  it('returns null when the capability has no active provider', async () => {
    expect(await svc.resolveConfig('storage')).toBeNull();
  });
});
