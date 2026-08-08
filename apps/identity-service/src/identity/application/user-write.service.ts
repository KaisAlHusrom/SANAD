import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '@sanad/database';
import type {
  AuthUser,
  UserCreateRequest,
  UserRoleAssignRequest,
  UserUpdateRequest,
} from '@sanad/contracts';
import type { UserRow } from '../../db/schema/index.js';
import { RbacRepository } from '../infrastructure/rbac.repository.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { PasswordHasher } from './password.hasher.js';
import { emailConflict, roleNotFound, userNotFound } from './user-errors.js';

/**
 * Write-side user management (admin, `identity.users.manage`). N14-compliant — depends only
 * on repositories + the `TransactionRunner` (never `DRIZZLE`): `create` hashes the password
 * and inserts the user + its role assignments in ONE transaction. Profile updates and single
 * role assign/revoke are atomic single-row writes (no tx needed). Every method returns the
 * resulting `AuthUser` (roles resolved fresh, password never echoed).
 */
@Injectable()
export class UserWriteService {
  constructor(
    private readonly users: UserRepository,
    private readonly rbac: RbacRepository,
    private readonly hasher: PasswordHasher,
    private readonly tx: TransactionRunner,
  ) {}

  async create(req: UserCreateRequest): Promise<AuthUser> {
    if (await this.users.findByEmail(req.email)) {
      throw emailConflict(req.email);
    }
    const password = await this.hasher.hash(req.password);
    const user = await this.tx.run(async (txExec) => {
      const row = await this.users.insert(txExec, {
        email: req.email,
        name: req.name,
        password,
        isActive: req.isActive,
      });
      for (const roleKey of req.roles) {
        const role = await this.rbac.findRoleByKey(roleKey);
        if (!role) {
          throw roleNotFound(roleKey);
        }
        await this.rbac.assignRoleToUser(row.id, role.id, txExec);
      }
      return row;
    });
    return this.toAuthUser(user);
  }

  async update(req: UserUpdateRequest): Promise<AuthUser> {
    const existing = await this.users.findById(req.id);
    if (!existing) {
      throw userNotFound(req.id);
    }
    if (req.email && req.email !== existing.email) {
      const other = await this.users.findByEmail(req.email);
      if (other && other.id !== req.id) {
        throw emailConflict(req.email);
      }
    }
    const patch: Partial<Pick<UserRow, 'name' | 'email' | 'isActive'>> = {};
    if (req.name !== undefined) patch.name = req.name;
    if (req.email !== undefined) patch.email = req.email;
    if (req.isActive !== undefined) patch.isActive = req.isActive;

    const updated =
      Object.keys(patch).length > 0
        ? await this.users.update(req.id, patch)
        : existing;
    return this.toAuthUser(updated);
  }

  async assignRole(req: UserRoleAssignRequest): Promise<AuthUser> {
    const user = await this.requireUser(req.userId);
    const role = await this.requireRole(req.role);
    await this.rbac.assignRoleToUser(user.id, role.id);
    return this.toAuthUser(user);
  }

  async revokeRole(req: UserRoleAssignRequest): Promise<AuthUser> {
    const user = await this.requireUser(req.userId);
    const role = await this.requireRole(req.role);
    await this.rbac.revokeRoleFromUser(user.id, role.id);
    return this.toAuthUser(user);
  }

  private async requireUser(id: string): Promise<UserRow> {
    const user = await this.users.findById(id);
    if (!user) {
      throw userNotFound(id);
    }
    return user;
  }

  private async requireRole(key: string): Promise<{ id: string }> {
    const role = await this.rbac.findRoleByKey(key);
    if (!role) {
      throw roleNotFound(key);
    }
    return role;
  }

  private async toAuthUser(user: UserRow): Promise<AuthUser> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: await this.rbac.getUserRoleKeys(user.id),
    };
  }
}
