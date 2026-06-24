import 'reflect-metadata';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed).
import pg from 'pg';
import { loadSettingsEnv } from '../env.js';

/**
 * Applies pending Drizzle migrations to the settings DB (never `push`, MS5). Run as a
 * dedicated step (the `db-migrate` target / a deploy migration container, OPS4).
 */
async function run(): Promise<void> {
  const env = loadSettingsEnv();
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: 'src/db/migrations' });
  await pool.end();
}

void run();
