import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  identityToHeaders,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  IDENTITY_PERMISSIONS,
  IDENTITY_USERS_LIST,
  listQuerySchema,
  type AuthUser,
  type ListQuery,
  type Paginated,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { IDENTITY_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The RBAC-guarded sample route (the P2 "Done when"): listing users requires
 * `identity.users.read`. `JwtAuthGuard` validates the token once (MS4) and
 * `PermissionsGuard` enforces the permission at the edge — a caller without it gets
 * 403 before any RMQ hop. The validated identity is forwarded in headers (MS4).
 */
@Controller('identity')
export class IdentityUsersController {
  constructor(@Inject(IDENTITY_CLIENT) private readonly client: ClientProxy) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersRead)
  async list(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<AuthUser>> {
    try {
      return await sendRequest<Paginated<AuthUser>>(
        this.client,
        IDENTITY_USERS_LIST,
        query,
        { headers: identityToHeaders(identity) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
