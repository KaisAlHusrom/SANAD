// Identity DB schema barrel (U10). Re-exports tables + the aggregate schema/handle.
export * from './user.table.js';
export * from './role.table.js';
export * from './permission.table.js';
export * from './role-permission.table.js';
export * from './user-role.table.js';
export * from './refresh-token.table.js';
export * from './schema.js';
// Re-export the shared Outbox table so drizzle-kit includes it in this service's
// migrations (each service owns its own outbox, MS3/MS5).
export { outboxTable } from '@sanad/messaging';
