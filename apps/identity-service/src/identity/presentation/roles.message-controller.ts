import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IDENTITY_ROLES_LIST, type RoleSummary } from '@sanad/contracts';
import { UserReadService } from '../application/user-read.service.js';

/**
 * RMQ entrypoint for the role catalog (MS2). The gateway enforces `identity.roles.read` at
 * the edge (MS4); identity just returns the bounded role list. Thin (U5).
 */
@Controller()
export class RolesMessageController {
  constructor(private readonly users: UserReadService) {}

  @MessagePattern(IDENTITY_ROLES_LIST)
  list(): Promise<RoleSummary[]> {
    return this.users.listRoles();
  }
}
