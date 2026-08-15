import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for the shared counter fragment.
 *
 * These migrations exist for TWO reasons and neither of them is "the lib owns a database":
 * (1) the lib's own DB-integration spec applies them to `sequence_test` (TDD2), and (2) they are
 * the reference DDL an adopting service can compare its generated migration against. A service
 * that mounts `sequenceCounterTable` in its schema generates the table into its OWN migrations
 * folder, in its OWN database (MS5). Tooling, not app runtime, so `process.env` is read directly.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/sequence-counter.table.ts',
  out: './src/lib/migrations',
  dbCredentials: {
    url:
      process.env['SEQUENCE_TEST_DATABASE_URL'] ??
      'postgresql://sanad:sanad@localhost:5440/sequence_test',
  },
  strict: true,
  verbose: true,
});
