// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';

/** The database every Postgres cluster has, used only to issue `CREATE DATABASE`. */
const MAINTENANCE_DATABASE = 'postgres';

/**
 * Create a `*_test` database if it is missing — **test harness only**, never called by a service.
 *
 * `infra/postgres/init/01-create-databases.sql` runs **once, on an empty data volume**, so a
 * database added to it after the dev stack first booted never appears on an existing machine:
 * the suite that needs it would then "skip cleanly" forever, which reads as green and proves
 * nothing (the 2026-07-19 false-green class). This closes that gap idempotently.
 *
 * Throws with the underlying reason rather than swallowing it — a caller that cannot create its
 * test database must say why, not degrade to a silent skip.
 */
export async function ensureTestDatabase(
  connectionString: string,
): Promise<void> {
  const target = new URL(connectionString);
  const database = decodeURIComponent(target.pathname.replace(/^\//, ''));
  if (!database.endsWith('_test')) {
    // A guard, not a formality: this helper issues DDL, and TDD2 says tests touch `*_test` only.
    throw new Error(
      `ensureTestDatabase refuses a non-test database: ${database} (TDD2)`,
    );
  }

  const maintenance = new URL(connectionString);
  maintenance.pathname = `/${MAINTENANCE_DATABASE}`;
  const pool = new pg.Pool({ connectionString: maintenance.toString() });
  try {
    const existing = await pool.query(
      'select 1 from pg_database where datname = $1',
      [database],
    );
    if (existing.rowCount === 0) {
      // Identifiers cannot be parameterised; the name is asserted `*_test` above and comes
      // from our own code, never from input.
      await pool.query(`create database "${database}"`);
    }
  } finally {
    await pool.end().catch(() => undefined);
  }
}
