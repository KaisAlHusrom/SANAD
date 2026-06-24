import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for the media service's OWN database (DB-per-service, MS5).
 * `generate` writes migrations to `src/db/migrations`; a dedicated migrate step
 * applies them (never `push` in prod, MS5). Tooling (not app runtime) → reads
 * `process.env` directly.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://sanad:sanad@localhost:5440/media',
  },
  strict: true,
  verbose: true,
});
