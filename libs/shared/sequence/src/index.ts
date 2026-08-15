// @sanad/sequence — gap-free, human-readable numbering (`PRO-2026-0001`). The shared counter
// table each service mounts in its OWN database (MS5), the single-statement allocator, and the
// formatter. The format shapes live in `@sanad/contracts` (U3). U10 barrel.
export * from './lib/sequence-counter.table.js';
export * from './lib/sequence-store.types.js';
export * from './lib/allocated-number.types.js';
export * from './lib/sequence-number/index.js';
export * from './lib/drizzle-sequence-store/index.js';
export * from './lib/sequence-allocator/index.js';
