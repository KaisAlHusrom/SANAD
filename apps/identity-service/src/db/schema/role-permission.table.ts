import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { permissionTable } from './permission.table.js';
import { roleTable } from './role.table.js';

/** Role↔permission join: which permissions a role grants. */
export const rolePermissionTable = pgTable(
  'role_permission',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissionTable.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);
