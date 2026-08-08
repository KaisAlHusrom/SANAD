import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  IDENTITY_PERMISSIONS,
  IDENTITY_ROLES_LIST,
  IDENTITY_USERS_CREATE,
  IDENTITY_USERS_LIST,
  IDENTITY_USERS_ROLE_ASSIGN,
  IDENTITY_USERS_ROLE_REVOKE,
  IDENTITY_USERS_UPDATE,
  listQuerySchema,
  roleSchema,
  userCreateSchema,
  userRoleAssignSchema,
  userUpdateSchema,
  type AuthUser,
  type ListQuery,
  type Paginated,
  type Role,
  type RoleSummary,
  type UserCreateRequest,
  type UserUpdateRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { IDENTITY_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The users + roles management surface (MS4). Reads require `identity.users.read` /
 * `identity.roles.read`; writes require `identity.users.manage`. `JwtAuthGuard` validates the
 * token once and `PermissionsGuard` enforces the permission at the edge — a caller without it
 * gets 403 before any RMQ hop. The validated identity is forwarded in headers (MS4). Thin (U5).
 */
@Controller('identity')
export class IdentityUsersController {
  constructor(@Inject(IDENTITY_CLIENT) private readonly client: ClientProxy) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersRead)
  list(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<AuthUser>> {
    return this.forward(IDENTITY_USERS_LIST, query, identity, locale);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersManage)
  create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(userCreateSchema)) body: UserCreateRequest,
  ): Promise<AuthUser> {
    return this.forward(IDENTITY_USERS_CREATE, body, identity, locale);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersManage)
  update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(userUpdateSchema.omit({ id: true })))
    body: Omit<UserUpdateRequest, 'id'>,
  ): Promise<AuthUser> {
    return this.forward(
      IDENTITY_USERS_UPDATE,
      { id, ...body },
      identity,
      locale,
    );
  }

  @Post('users/:id/roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersManage)
  assignRole(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(userRoleAssignSchema.pick({ role: true })))
    body: { role: Role },
  ): Promise<AuthUser> {
    return this.forward(
      IDENTITY_USERS_ROLE_ASSIGN,
      { userId: id, role: body.role },
      identity,
      locale,
    );
  }

  @Delete('users/:id/roles/:role')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.usersManage)
  revokeRole(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('role', new ZodValidationPipe(roleSchema)) role: Role,
  ): Promise<AuthUser> {
    return this.forward(
      IDENTITY_USERS_ROLE_REVOKE,
      { userId: id, role },
      identity,
      locale,
    );
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(IDENTITY_PERMISSIONS.rolesRead)
  listRoles(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
  ): Promise<RoleSummary[]> {
    return this.forward(IDENTITY_ROLES_LIST, {}, identity, locale);
  }

  private async forward<TResult>(
    pattern: string,
    payload: object,
    identity: IdentityContext,
    locale: Locale,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: forwardHeaders(identity, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
