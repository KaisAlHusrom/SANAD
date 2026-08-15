import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for the shared audit fragment. As with `@sanad/sequence`, these migrations
 * exist so the lib's own integration suite has real tables (TDD2) and so an adopting service has
 * reference DDL — the lib owns no database. A service that mounts `auditLogTable` generates the
 * table into its OWN migrations folder and applies `AUDIT_IMMUTABILITY_SQL` in a custom migration
 * beside it (drizzle-kit cannot generate a trigger).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/audit-log.table.ts',
  out: './src/lib/migrations',
  dbCredentials: {
    url:
      process.env['AUDIT_TEST_DATABASE_URL'] ??
      'postgresql://sanad:sanad@localhost:5440/audit_test',
  },
  strict: true,
  verbose: true,
});
