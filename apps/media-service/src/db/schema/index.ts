// Media service DB schema — folders, assets, alt translations (+ Outbox). Barrel (U10).
export * from './enums.js';
export * from './media-folder.table.js';
export * from './media-asset.table.js';
export * from './media-asset-translation.table.js';
export * from './schema.js';
// Re-export the shared Outbox table so drizzle-kit includes it in this service's
// migrations (each service owns its own outbox, MS3/MS5).
export { outboxTable } from '@sanad/messaging';
