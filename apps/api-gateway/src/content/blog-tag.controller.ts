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
  CONTENT_BLOG_TAG_CREATE,
  CONTENT_BLOG_TAG_DELETE,
  CONTENT_BLOG_TAG_LIST,
  CONTENT_BLOG_TAG_REORDER,
  CONTENT_BLOG_TAG_UPDATE,
  CONTENT_PERMISSIONS,
  blogTagCreateSchema,
  blogTagListQuerySchema,
  blogTagUpdateSchema,
  reorderRequestSchema,
  type BlogTagCreateRequest,
  type BlogTagItem,
  type BlogTagListQuery,
  type BlogTagUpdateRequest,
  type ContentId,
  type Paginated,
  type ReorderRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
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
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(blogTagListQuerySchema))
    query: BlogTagListQuery,
  ): Promise<Paginated<BlogTagItem>> {
    return this.forwardPublic(CONTENT_BLOG_TAG_LIST, query, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(blogTagCreateSchema))
    body: BlogTagCreateRequest,
  ): Promise<BlogTagItem> {
    return this.forward(CONTENT_BLOG_TAG_CREATE, body, identity, locale);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_BLOG_TAG_REORDER, body, identity, locale);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(blogTagUpdateSchema.omit({ id: true })))
    body: Omit<BlogTagUpdateRequest, 'id'>,
  ): Promise<BlogTagItem> {
    return this.forward(
      CONTENT_BLOG_TAG_UPDATE,
      { id, ...body },
      identity,
      locale,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_BLOG_TAG_DELETE, { id }, identity, locale);
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

  private async forwardPublic<TResult>(
    pattern: string,
    payload: object,
    locale: Locale,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: forwardHeaders(null, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
