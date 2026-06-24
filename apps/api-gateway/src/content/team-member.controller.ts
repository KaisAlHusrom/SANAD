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
  identityToHeaders,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  CONTENT_PERMISSIONS,
  CONTENT_TEAM_MEMBER_CREATE,
  CONTENT_TEAM_MEMBER_DELETE,
  CONTENT_TEAM_MEMBER_GET,
  CONTENT_TEAM_MEMBER_LIST,
  CONTENT_TEAM_MEMBER_UPDATE,
  teamMemberCreateSchema,
  teamMemberListQuerySchema,
  teamMemberUpdateSchema,
  type ContentId,
  type Paginated,
  type TeamMemberCreateRequest,
  type TeamMemberItem,
  type TeamMemberListQuery,
  type TeamMemberUpdateRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The team-members collection surface (MS4). list + detail are **public** (the website About
 * page); create/update/delete are guarded by `content.manage`. Thin (U5).
 */
@Controller('content/team')
export class TeamMemberController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(teamMemberListQuerySchema))
    query: TeamMemberListQuery,
  ): Promise<Paginated<TeamMemberItem>> {
    return this.forwardPublic(CONTENT_TEAM_MEMBER_LIST, query);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string): Promise<TeamMemberItem> {
    return this.forwardPublic(CONTENT_TEAM_MEMBER_GET, { slug });
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(teamMemberCreateSchema))
    body: TeamMemberCreateRequest,
  ): Promise<TeamMemberItem> {
    return this.forward(CONTENT_TEAM_MEMBER_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(teamMemberUpdateSchema.omit({ id: true })))
    body: Omit<TeamMemberUpdateRequest, 'id'>,
  ): Promise<TeamMemberItem> {
    return this.forward(CONTENT_TEAM_MEMBER_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_TEAM_MEMBER_DELETE, { id }, identity);
  }

  private async forward<TResult>(
    pattern: string,
    payload: object,
    identity: IdentityContext,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: identityToHeaders(identity),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  private async forwardPublic<TResult>(
    pattern: string,
    payload: object,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload);
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
