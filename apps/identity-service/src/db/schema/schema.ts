import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxTable } from '@sanad/messaging';
import { permissionTable } from './permission.table.js';
import { refreshTokenTable } from './refresh-token.table.js';
import { rolePermissionTable } from './role-permission.table.js';
import { roleTable } from './role.table.js';
import { userRoleTable } from './user-role.table.js';
import { userTable } from './user.table.js';

/** The identity service's full Drizzle schema (its own DB, MS5) — incl. the Outbox. */
export const schema = {
  userTable,
  roleTable,
  permissionTable,
  rolePermissionTable,
  userRoleTable,
  refreshTokenTable,
  outboxTable,
};

/** The typed Drizzle handle bound to this service's schema (injected via `DRIZZLE`). */
export type IdentityDb = NodePgDatabase<typeof schema>;
