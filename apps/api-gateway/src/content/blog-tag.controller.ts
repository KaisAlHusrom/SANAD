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
  CONTENT_BLOG_TAG_CREATE,
  CONTENT_BLOG_TAG_DELETE,
  CONTENT_BLOG_TAG_LIST,
  CONTENT_BLOG_TAG_UPDATE,
  CONTENT_PERMISSIONS,
  blogTagCreateSchema,
  blogTagListQuerySchema,
  blogTagUpdateSchema,
  type BlogTagCreateRequest,
  type BlogTagItem,
  type BlogTagListQuery,
  type BlogTagUpdateRequest,
  type ContentId,
  type Paginated,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The blog-tags surface (MS4). list is **public** (the blog filter); create/update/delete are
 * guarded by `content.manage`. Thin (U5).
 */
@Controller('content/blog-tags')
export class BlogTagController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(blogTagListQuerySchema))
    query: BlogTagListQuery,
  ): Promise<Paginated<BlogTagItem>> {
    return this.forwardPublic(CONTENT_BLOG_TAG_LIST, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(blogTagCreateSchema))
    body: BlogTagCreateRequest,
  ): Promise<BlogTagItem> {
    return this.forward(CONTENT_BLOG_TAG_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(blogTagUpdateSchema.omit({ id: true })))
    body: Omit<BlogTagUpdateRequest, 'id'>,
  ): Promise<BlogTagItem> {
    return this.forward(CONTENT_BLOG_TAG_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_BLOG_TAG_DELETE, { id }, identity);
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
