import 'reflect-metadata';
import { describe, expect, it, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { DateTimeService } from '@sanad/database';
import { schema, type SettingsDb } from '../../db/schema/index.js';
import type { SettingsEnv } from '../../env.js';
import { SecretCipherService } from '../application/crypto/secret-cipher.service.js';
import { SecretsService } from '../application/secrets.service.js';
import { IntegrationSecretRepository } from './integration-secret.repository.js';

// The dedicated test DB (TDD2) — created by infra/postgres/init/01-create-databases.sql.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/settings_test';
const KEY = 'c2FuYWQtZGV2LXNlY3JldHMtZW5jcnlwdGlvbi1rZXk='; // base64 of 32 bytes
// Real user ids are UUIDs (forwarded from identity, MS4); the audit column is `uuid`.
const USER_1 = '11111111-1111-1111-1111-111111111111';
const USER_2 = '22222222-2222-2222-2222-222222222222';

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: 'src/db/migrations' });
    return pool;
  } catch {
    await pool.end().catch(() => undefined);
    return null;
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'settings_test unreachable — skipping integration-secret DB tests (TDD2).',
  );
}

describeDb('integration-secret vault (settings_test, N13)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (suite skipped) — narrows the type for TS
  }
  const db = drizzle(activePool, { schema }) as SettingsDb;
  const clock = new DateTimeService();
  const repo = new IntegrationSecretRepository(db, clock);
  const cipher = new SecretCipherService({
    APP_SECRETS_ENCRYPTION_KEY: KEY,
  } as SettingsEnv);

  /** A service whose env supplies the given SMTP_PASSWORD fallback (DB → env → null). */
  function service(envFallback?: string): SecretsService {
    return new SecretsService(repo, cipher, {
      APP_SECRETS_ENCRYPTION_KEY: KEY,
      SMTP_PASSWORD: envFallback,
    } as SettingsEnv);
  }

  beforeEach(async () => {
    await activePool.query('truncate table integration_secret');
  });

  it('set → masked status (no plaintext) + resolve decrypts', async () => {
    const svc = service();
    const status = await svc.setSecret('SMTP_PASSWORD', 'my-smtp-pw', USER_1);
    expect(status).toMatchObject({
      key: 'SMTP_PASSWORD',
      isSet: true,
      fromEnv: false,
      last4: 'p-pw',
      updatedByUserId: USER_1,
    });
    expect(status.updatedAt).not.toBeNull();

    // The decrypted value is recoverable server-side only.
    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBe('my-smtp-pw');
  });

  it('masks the encrypted columns by default, exposes them only via withSecret (N2)', async () => {
    await service().setSecret('SMTP_PASSWORD', 'pw', USER_1);

    const masked = await repo.findByKey('SMTP_PASSWORD');
    expect(masked).not.toBeNull();
    expect(masked).not.toHaveProperty('ciphertext');
    expect(masked).not.toHaveProperty('iv');
    expect(masked).not.toHaveProperty('authTag');

    const withSecret = await repo.findByKeyWithSecret('SMTP_PASSWORD');
    expect(withSecret?.ciphertext).toBeTruthy();
    expect(withSecret?.iv).toBeTruthy();
    expect(withSecret?.authTag).toBeTruthy();
  });

  it('rotates in place (one live row; resolve returns the latest value)', async () => {
    const svc = service();
    await svc.setSecret('SMTP_PASSWORD', 'old-value', USER_1);
    const status = await svc.setSecret('SMTP_PASSWORD', 'new-value', USER_2);

    expect(status.last4).toBe('alue');
    expect(status.updatedByUserId).toBe(USER_2);
    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBe('new-value');

    const { rows } = await activePool.query(
      "select count(*)::int as n from integration_secret where key = 'SMTP_PASSWORD' and deleted_at is null",
    );
    expect(rows[0].n).toBe(1);
  });

  it('clear-then-reset works under the partial unique index (no key collision)', async () => {
    const svc = service();
    await svc.setSecret('SMTP_PASSWORD', 'first', USER_1);
    await svc.clearSecret('SMTP_PASSWORD');

    // Cleared → resolution falls through to null (no env fallback configured).
    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBeNull();
    const cleared = (await svc.getStatuses()).find(
      (s) => s.key === 'SMTP_PASSWORD',
    );
    expect(cleared?.isSet).toBe(false);

    // Re-setting the same key must not violate the unique index.
    await svc.setSecret('SMTP_PASSWORD', 'second', USER_1);
    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBe('second');
  });

  it('falls back to env when no vault row, reporting fromEnv (DB → env → null)', async () => {
    const svc = service('env-fallback-pw');

    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBe('env-fallback-pw');
    const status = (await svc.getStatuses()).find(
      (s) => s.key === 'SMTP_PASSWORD',
    );
    expect(status).toMatchObject({ isSet: true, fromEnv: true });
    expect(status?.last4).toBe('env-fallback-pw'.slice(-4));

    // A stored vault value takes precedence over the env fallback.
    await svc.setSecret('SMTP_PASSWORD', 'vault-wins', USER_1);
    expect(await svc.resolveSecret('SMTP_PASSWORD')).toBe('vault-wins');
    const after = (await svc.getStatuses()).find(
      (s) => s.key === 'SMTP_PASSWORD',
    );
    expect(after?.fromEnv).toBe(false);
  });
});
