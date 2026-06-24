import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IDENTITY_USERS_LIST,
  listQuerySchema,
  type AuthUser,
  type ListQuery,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { UserReadService } from '../application/user-read.service.js';

/**
 * RMQ entrypoint for listing users (MS2). The gateway already enforced
 * `identity.users.read` at the edge (MS4); identity trusts that and just reads.
 */
@Controller()
export class UsersMessageController {
  constructor(private readonly users: UserReadService) {}

  @MessagePattern(IDENTITY_USERS_LIST)
  list(
    @Payload(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<AuthUser>> {
    return this.users.list(query);
  }
}
