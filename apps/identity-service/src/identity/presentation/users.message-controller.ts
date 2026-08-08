import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IDENTITY_USERS_CREATE,
  IDENTITY_USERS_LIST,
  IDENTITY_USERS_ROLE_ASSIGN,
  IDENTITY_USERS_ROLE_REVOKE,
  IDENTITY_USERS_UPDATE,
  listQuerySchema,
  userCreateSchema,
  userRoleAssignSchema,
  userUpdateSchema,
  type AuthUser,
  type ListQuery,
  type Paginated,
  type UserCreateRequest,
  type UserRoleAssignRequest,
  type UserUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { UserReadService } from '../application/user-read.service.js';
import { UserWriteService } from '../application/user-write.service.js';

/**
 * RMQ entrypoints for user management (MS2). The gateway enforces the permission at the edge
 * (`identity.users.read` for the list, `identity.users.manage` for the writes, MS4); identity
 * trusts that. Thin — validate, delegate (U5).
 */
@Controller()
export class UsersMessageController {
  constructor(
    private readonly users: UserReadService,
    private readonly writer: UserWriteService,
  ) {}

  @MessagePattern(IDENTITY_USERS_LIST)
  list(
    @Payload(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<AuthUser>> {
    return this.users.list(query);
  }

  @MessagePattern(IDENTITY_USERS_CREATE)
  create(
    @Payload(new ZodValidationPipe(userCreateSchema)) body: UserCreateRequest,
  ): Promise<AuthUser> {
    return this.writer.create(body);
  }

  @MessagePattern(IDENTITY_USERS_UPDATE)
  update(
    @Payload(new ZodValidationPipe(userUpdateSchema)) body: UserUpdateRequest,
  ): Promise<AuthUser> {
    return this.writer.update(body);
  }

  @MessagePattern(IDENTITY_USERS_ROLE_ASSIGN)
  assignRole(
    @Payload(new ZodValidationPipe(userRoleAssignSchema))
    body: UserRoleAssignRequest,
  ): Promise<AuthUser> {
    return this.writer.assignRole(body);
  }

  @MessagePattern(IDENTITY_USERS_ROLE_REVOKE)
  revokeRole(
    @Payload(new ZodValidationPipe(userRoleAssignSchema))
    body: UserRoleAssignRequest,
  ): Promise<AuthUser> {
    return this.writer.revokeRole(body);
  }
}
