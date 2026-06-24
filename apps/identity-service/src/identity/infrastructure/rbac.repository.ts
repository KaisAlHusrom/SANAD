import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@sanad/database';
import {
  permissionTable,
  rolePermissionTable,
  roleTable,
  userRoleTable,
  type IdentityDb,
  type RoleRow,
} from '../../db/schema/index.js';

/**
 * The RBAC graph (roles, permissions, and their links) — one cohesive aggregate (N1).
 * All upserts are idempotent (`onConflictDoNothing`) so the seed is safe to re-run
 * (decision 3). The resolve queries feed the access-token permission claim.
 */
@Injectable()
export class RbacRepository {
  constructor(@Inject(DRIZZLE) private readonly db: IdentityDb) {}

  async ensurePermission(key: string, description: string): Promise<string> {
    await this.db
      .insert(permissionTable)
      .values({ key, description })
      .onConflictDoNothing({ target: permissionTable.key });
    const rows = await this.db
      .select({ id: permissionTable.id })
      .from(permissionTable)
      .where(eq(permissionTable.key, key))
      .limit(1);
    return rows[0]?.id ?? '';
  }

  async ensureRole(
    key: string,
    name: string,
    description: string,
  ): Promise<string> {
    await this.db
      .insert(roleTable)
      .values({ key, name, description })
      .onConflictDoNothing({ target: roleTable.key });
    const rows = await this.db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(eq(roleTable.key, key))
      .limit(1);
    return rows[0]?.id ?? '';
  }

  async findRoleByKey(key: string): Promise<RoleRow | null> {
    const rows = await this.db
      .select()
      .from(roleTable)
      .where(eq(roleTable.key, key))
      .limit(1);
    return rows[0] ?? null;
  }

  async attachPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await this.db
      .insert(rolePermissionTable)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db
      .insert(userRoleTable)
      .values({ userId, roleId })
      .onConflictDoNothing();
  }

  /** The role keys a user holds (e.g. `['admin']`). */
  async getUserRoleKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: roleTable.key })
      .from(userRoleTable)
      .innerJoin(roleTable, eq(roleTable.id, userRoleTable.roleId))
      .where(eq(userRoleTable.userId, userId));
    return rows.map((row) => row.key);
  }

  /** The distinct permission keys a user has via their roles (deduped). */
  async getUserPermissionKeys(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ key: permissionTable.key })
      .from(userRoleTable)
      .innerJoin(
        rolePermissionTable,
        eq(rolePermissionTable.roleId, userRoleTable.roleId),
      )
      .innerJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(eq(userRoleTable.userId, userId));
    return rows.map((row) => row.key);
  }
}
