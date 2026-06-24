// Settings service DB schema — catalog, scope-keyed values, translations (+ Outbox).
// Barrel only (U10).
export * from './enums.js';
export * from './value.types.js';
export * from './setting.table.js';
export * from './setting-value.table.js';
export * from './setting-translation.table.js';
export * from './schema.js';
// Re-export the shared Outbox table so drizzle-kit includes it in this service's
// migrations (each service owns its own outbox, MS3/MS5).
export { outboxTable } from '@sanad/messaging';
