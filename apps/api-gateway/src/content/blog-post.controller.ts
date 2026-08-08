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
  CONTENT_BLOG_POST_CREATE,
  CONTENT_BLOG_POST_DELETE,
  CONTENT_BLOG_POST_GET,
  CONTENT_BLOG_POST_GET_BY_ID,
  CONTENT_BLOG_POST_LIST,
  CONTENT_BLOG_POST_UPDATE,
  CONTENT_PERMISSIONS,
  blogPostCreateSchema,
  blogPostListQuerySchema,
  blogPostUpdateSchema,
  type BlogPostCreateRequest,
  type BlogPostItem,
  type BlogPostListQuery,
  type BlogPostUpdateRequest,
  type ContentId,
  type Paginated,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The blog posts / articles surface (MS4). The public list + detail force `status=published`
 * (drafts never leak — N7); the **`manage`** list is guarded `content.read` and sees drafts;
 * create/update/delete are guarded `content.manage`. (`manage` is a reserved path segment,
 * declared before `:slug`.) Thin (U5).
 */
@Controller('content/blog')
export class BlogPostController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(blogPostListQuerySchema))
    query: BlogPostListQuery,
  ): Promise<Paginated<BlogPostItem>> {
    // Public path: force published — a client can never request drafts (N7).
    return this.forwardPublic(
      CONTENT_BLOG_POST_LIST,
      {
        ...query,
        status: 'published',
      },
      locale,
    );
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async manageList(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(blogPostListQuerySchema))
    query: BlogPostListQuery,
  ): Promise<Paginated<BlogPostItem>> {
    // Admin path: honors the supplied `status` (or omits it to see every post).
    return this.forward(CONTENT_BLOG_POST_LIST, query, identity, locale);
  }

  @Get('manage/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async manageGet(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BlogPostItem> {
    // Admin fetch by id — drafts visible (the edit page).
    return this.forward(CONTENT_BLOG_POST_GET_BY_ID, { id }, identity, locale);
  }

  @Get(':slug')
  async get(
    @RequestLocale() locale: Locale,
    @Param('slug') slug: string,
  ): Promise<BlogPostItem> {
    return this.forwardPublic(CONTENT_BLOG_POST_GET, { slug }, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(blogPostCreateSchema))
    body: BlogPostCreateRequest,
  ): Promise<BlogPostItem> {
    return this.forward(CONTENT_BLOG_POST_CREATE, body, identity, locale);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(blogPostUpdateSchema.omit({ id: true })))
    body: Omit<BlogPostUpdateRequest, 'id'>,
  ): Promise<BlogPostItem> {
    return this.forward(
      CONTENT_BLOG_POST_UPDATE,
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
    return this.forward(CONTENT_BLOG_POST_DELETE, { id }, identity, locale);
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
