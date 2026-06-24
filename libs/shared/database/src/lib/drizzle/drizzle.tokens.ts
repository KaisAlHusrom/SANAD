/** DI token for the raw node-postgres connection pool. */
export const PG_POOL = Symbol('PG_POOL');

/** DI token for the Drizzle database handle bound to a service's schema. */
export const DRIZZLE = Symbol('DRIZZLE');
