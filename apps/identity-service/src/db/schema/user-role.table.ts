import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { roleTable } from './role.table.js';
import { userTable } from './user.table.js';

/** User↔role join: which roles a user holds. */
export const userRoleTable = pgTable(
  'user_role',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);
