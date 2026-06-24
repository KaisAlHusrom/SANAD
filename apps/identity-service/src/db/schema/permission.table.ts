import { pgTable, text } from 'drizzle-orm/pg-core';
import { pk, timestamps } from '@sanad/database';

/** Permissions. `key` is `<resource>.<action>` (e.g. `identity.users.read`). */
export const permissionTable = pgTable('permission', {
  id: pk(),
  key: text('key').notNull().unique(),
  description: text('description'),
  ...timestamps(),
});

export type PermissionRow = typeof permissionTable.$inferSelect;
