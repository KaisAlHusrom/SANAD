import { Injectable } from '@nestjs/common';
import type {
  AuthUser,
  ListQuery,
  Paginated,
  RoleSummary,
} from '@sanad/contracts';
import { RbacRepository } from '../infrastructure/rbac.repository.js';
import { UserRepository } from '../infrastructure/user.repository.js';

/** Read-side queries for users + roles (the gateway's RBAC-guarded reads). */
@Injectable()
export class UserReadService {
  constructor(
    private readonly users: UserRepository,
    private readonly rbac: RbacRepository,
  ) {}

  /** The role catalog for the admin users surface (`identity.roles.read`). */
  listRoles(): Promise<RoleSummary[]> {
    return this.rbac.listRoles();
  }

  async list(query: ListQuery): Promise<Paginated<AuthUser>> {
    const page = await this.users.list(query);
    const items = await Promise.all(
      page.items.map(async (user): Promise<AuthUser> => {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          roles: await this.rbac.getUserRoleKeys(user.id),
        };
      }),
    );
    return { items, meta: page.meta };
  }
}
