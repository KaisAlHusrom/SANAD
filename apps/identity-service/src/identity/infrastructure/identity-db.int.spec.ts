import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import {
  DateTimeService,
  failIfDbTestsRequired,
  type TransactionRunner,
} from '@sanad/database';
import type { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { schema, type IdentityDb } from '../../db/schema/index.js';
import { UserReadService } from '../application/user-read.service.js';
import { UserWriteService } from '../application/user-write.service.js';
import { PasswordHasher } from '../application/password.hasher.js';
import { RbacRepository } from './rbac.repository.js';
import { UserRepository } from './user.repository.js';

// The dedicated test DB (TDD2) — SKIPs cleanly when the dev Postgres is down.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/identity_test';

// Resolve the migrations dir from THIS file, not the CWD — vitest's cwd differs by how it is
// invoked, and a CWD-relative path made `migrate()` throw and the suite SILENTLY skip (false green).
const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

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
    await pool.end().catch(() => undefined);
    failIfDbTestsRequired(TEST_DB_URL, error);
    return null;
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'identity_test unreachable — skipping DB integration tests (TDD2). Start the dev Postgres to run them.',
  );
}

function statusOf(error: unknown): number {
  const payload = (error as RpcException).getError();
  return (payload as { statusCode: number }).statusCode;
}

describeDb('identity-service DB integration (identity_test, TDD2)', () => {
  const activePool = pool as pg.Pool;
  const db = drizzle(activePool, { schema }) as unknown as IdentityDb;
  const dateTime = new DateTimeService();
  const users = new UserRepository(db, dateTime);
  const rbac = new RbacRepository(db);
  // A fake hasher keeps the test fast + free of the native argon2 module (DB behavior is
  // what we exercise here, not hashing).
  const hasher = {
    hash: (plain: string) => Promise.resolve(`hashed:${plain}`),
    verify: () => Promise.resolve(true),
  } as unknown as PasswordHasher;
  const tx = {
    run: <T>(work: (exec: unknown) => Promise<T>) => db.transaction(work),
  } as unknown as TransactionRunner;
  const writer = new UserWriteService(users, rbac, hasher, tx);
  const reader = new UserReadService(users, rbac);

  beforeEach(async () => {
    await activePool.query(
      'TRUNCATE "user", "user_role", "role" RESTART IDENTITY CASCADE',
    );
    await rbac.ensureRole('admin', 'Admin', 'Full access');
    await rbac.ensureRole('developer', 'Developer', 'Builds software');
  });

  it('creates a user with roles and lists it back with those roles', async () => {
    const created = await writer.create({
      email: 'staff@sanad.tech',
      name: 'Staff Member',
      password: 'supersecret',
      isActive: true,
      roles: ['admin'],
    });
    expect(created.roles).toEqual(['admin']);

    const page = await reader.list({ page: 1, pageSize: 50, order: 'asc' });
    const found = page.items.find((u) => u.email === 'staff@sanad.tech');
    expect(found).toBeDefined();
    expect(found?.roles).toEqual(['admin']);
  });

  it('assigns then revokes a role', async () => {
    const created = await writer.create({
      email: 'dev@sanad.tech',
      name: 'Dev',
      password: 'supersecret',
      isActive: true,
      roles: ['admin'],
    });

    await writer.assignRole({ userId: created.id, role: 'developer' });
    expect((await rbac.getUserRoleKeys(created.id)).sort()).toEqual([
      'admin',
      'developer',
    ]);

    const afterRevoke = await writer.revokeRole({
      userId: created.id,
      role: 'admin',
    });
    expect(afterRevoke.roles).toEqual(['developer']);
  });

  it('deactivates a user via update', async () => {
    const created = await writer.create({
      email: 'inactive@sanad.tech',
      name: 'Soon Inactive',
      password: 'supersecret',
      isActive: true,
      roles: [],
    });

    const updated = await writer.update({ id: created.id, isActive: false });
    expect(updated.isActive).toBe(false);
  });

  it('rejects a duplicate email with 409', async () => {
    await writer.create({
      email: 'dupe@sanad.tech',
      name: 'First',
      password: 'supersecret',
      isActive: true,
      roles: [],
    });
    const error = await writer
      .create({
        email: 'dupe@sanad.tech',
        name: 'Second',
        password: 'supersecret',
        isActive: true,
        roles: [],
      })
      .catch((e: unknown) => e);
    expect(statusOf(error)).toBe(HttpStatus.CONFLICT);
  });
});
