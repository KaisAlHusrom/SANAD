import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { notificationTable } from './notification.table.js';
import { processedMessageTable } from './processed-message.table.js';

/**
 * The notifications service's full Drizzle schema (its own DB, MS5). No Outbox — this
 * service consumes events and serves reads; it emits no domain events in P6.
 */
export const schema = {
  notificationTable,
  processedMessageTable,
};

/** The typed Drizzle handle bound to this service's schema (injected via `DRIZZLE`). */
export type NotificationsDb = NodePgDatabase<typeof schema>;
