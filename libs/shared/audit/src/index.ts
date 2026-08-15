// @sanad/audit — the append-only trail (P8.8): the shared table fragment each service mounts in
// its OWN database (MS5), the database-enforced immutability guard, the redacting store, and the
// NestJS seam (`@Audited()` + interceptor + recorder) that stamps every row with its actor and
// the caller's circumstances. This is the evidence layer e-signature (P8.14) rests on. U10 barrel.
export * from './lib/audit-log.table.js';
export * from './lib/audit-immutability.constants.js';
export * from './lib/audit.constants.js';
export * from './lib/audit-entry.types.js';
export * from './lib/redact.constants.js';
export * from './lib/redact/index.js';
export * from './lib/diff-fields/index.js';
export * from './lib/drizzle-audit-store/index.js';
export * from './lib/nest/index.js';
