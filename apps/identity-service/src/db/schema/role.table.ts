import { pgTable, text } from 'drizzle-orm/pg-core';
import { pk, timestamps } from '@sanad/database';

/** Roles. `key` matches the `Role` union in `@sanad/auth` (admin, developer, …, client). */
export const roleTable = pgTable('role', {
  id: pk(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  ...timestamps(),
});

export type RoleRow = typeof roleTable.$inferSelect;
