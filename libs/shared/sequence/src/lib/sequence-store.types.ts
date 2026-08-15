import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * A Drizzle handle OR an open transaction. Allocation belongs INSIDE the caller's business
 * transaction: that is what makes the run gap-free, because a rolled-back write rolls the
 * counter back with it.
 */
export type SequenceDb = Pick<NodePgDatabase<Record<string, never>>, 'insert'>;

/** The counter the allocator bumps. One statement, one row lock (see `DrizzleSequenceStore`). */
export interface SequenceStore {
  /** Bump `(entity, period)` and return the value this caller now owns. */
  allocate(exec: SequenceDb, entity: string, period: string): Promise<number>;
}

/** The period key a counter resets on: a year (`'2026'`) or the single continuous run. */
export const CONTINUOUS_PERIOD = 'ALL';
