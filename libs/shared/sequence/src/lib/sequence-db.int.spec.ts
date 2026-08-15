import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import {
  DateTimeService,
  ensureTestDatabase,
  failIfDbTestsRequired,
} from '@sanad/database';
import { DrizzleSequenceStore } from './drizzle-sequence-store/drizzle-sequence-store.js';
import { SequenceAllocator } from './sequence-allocator/sequence-allocator.js';
import { sequenceCounterTable } from './sequence-counter.table.js';
import type { SequenceDb } from './sequence-store.types.js';

// The dedicated test DB (TDD2) on the project's fixed dev Postgres port block. Created by
// infra/postgres/init/01-create-databases.sql on a fresh volume, and by `ensureTestDatabase`
// on a machine whose volume predates it.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/sequence_test';

// Resolve the migrations dir from THIS file, never the CWD — a CWD-relative path made
// `migrate()` throw and six suites SILENTLY skip once (rules change-log 2026-07-19).
const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

/** How many workers race for a number in the concurrency proof (U18). */
const CONCURRENT_WORKERS = 20;

async function tryConnect(): Promise<pg.Pool | null> {
  try {
    await ensureTestDatabase(TEST_DB_URL);
  } catch (error) {
    console.warn(
      `sequence_test could not be created (${String(error instanceof Error ? error.message : error)})`,
    );
    failIfDbTestsRequired(TEST_DB_URL, error);
    return null;
  }
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
    max: CONCURRENT_WORKERS + 2,
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    return pool;
  } catch (error) {
    // Report WHY we're skipping — a silent skip hides a real migration failure as "green".
    console.warn(
      `sequence_test unavailable (${String(error instanceof Error ? error.message : error)})`,
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
    'sequence_test unreachable — skipping DB integration tests (TDD2). Start the dev Postgres to run them.',
  );
}

describeDb('sequence allocation (sequence_test, TDD2)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (the suite is skipped) — narrows the type for TS
  }
  const db = drizzle(activePool);
  const clock = DateTimeService.fixed('2026-05-01T00:00:00.000Z');
  const store = new DrizzleSequenceStore(clock);
  const allocator = new SequenceAllocator(store, clock);

  beforeEach(async () => {
    await db.execute(sql`truncate table "sequence_counter"`);
  });

  it('starts at 1 and increments', async () => {
    expect(await store.allocate(db, 'proposal', '2026')).toBe(1);
    expect(await store.allocate(db, 'proposal', '2026')).toBe(2);
    expect(await store.allocate(db, 'proposal', '2026')).toBe(3);
  });

  it('keeps a separate run per entity AND per period', async () => {
    expect(await store.allocate(db, 'proposal', '2026')).toBe(1);
    expect(await store.allocate(db, 'contract', '2026')).toBe(1);
    expect(await store.allocate(db, 'proposal', '2027')).toBe(1);
    expect(await store.allocate(db, 'proposal', '2026')).toBe(2);
  });

  it('prints the allocated number end to end', async () => {
    await expect(allocator.next(db, 'proposal')).resolves.toEqual({
      number: 'PRO-2026-0001',
      value: 1,
      period: '2026',
    });
  });

  // ── The phase's named acceptance proof (02-mvp.md P8.8 "Done when") ──────────────────
  it(`allocates from ${CONCURRENT_WORKERS} CONCURRENT transactions with no gaps and no duplicates`, async () => {
    const allocations = await Promise.all(
      Array.from({ length: CONCURRENT_WORKERS }, async () => {
        // A real connection each, a real transaction each — one pool client cannot race itself.
        const client = await activePool.connect();
        try {
          await client.query('begin');
          const value = await store.allocate(
            drizzle(client) as unknown as SequenceDb,
            'proposal',
            '2026',
          );
          await client.query('commit');
          return value;
        } catch (error) {
          await client.query('rollback');
          throw error;
        } finally {
          client.release();
        }
      }),
    );

    const sorted = [...allocations].sort((left, right) => left - right);
    expect(new Set(allocations).size).toBe(CONCURRENT_WORKERS); // no duplicates
    expect(sorted).toEqual(
      Array.from({ length: CONCURRENT_WORKERS }, (_unused, index) => index + 1),
    ); // no gaps
  });

  it('returns the number to the run when the caller ROLLS BACK — this is what gap-free means', async () => {
    const client = await activePool.connect();
    try {
      await client.query('begin');
      const abandoned = await store.allocate(
        drizzle(client) as unknown as SequenceDb,
        'invoice',
        '2026',
      );
      expect(abandoned).toBe(1);
      await client.query('rollback');
    } finally {
      client.release();
    }
    expect(await store.allocate(db, 'invoice', '2026')).toBe(1);
  });

  it('persists exactly one counter row per (entity, period)', async () => {
    await store.allocate(db, 'document', '2026');
    await store.allocate(db, 'document', '2026');
    const rows = await db.select().from(sequenceCounterTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.lastValue).toBe(2);
  });
});
