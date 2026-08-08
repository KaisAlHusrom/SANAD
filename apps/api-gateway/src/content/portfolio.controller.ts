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
  CONTENT_PERMISSIONS,
  CONTENT_PORTFOLIO_CREATE,
  CONTENT_PORTFOLIO_DELETE,
  CONTENT_PORTFOLIO_GET,
  CONTENT_PORTFOLIO_LIST,
  CONTENT_PORTFOLIO_REORDER,
  CONTENT_PORTFOLIO_UPDATE,
  portfolioCreateSchema,
  portfolioListQuerySchema,
  portfolioUpdateSchema,
  reorderRequestSchema,
  type ContentId,
  type Paginated,
  type PortfolioCreateRequest,
  type PortfolioListQuery,
  type PortfolioProjectItem,
  type PortfolioUpdateRequest,
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
 * The portfolio projects / case studies surface (MS4). The public list + detail force
 * `status=published` (drafts never leak — N7); the **`manage`** list is guarded `content.read`
 * and sees drafts; create/update/delete are guarded `content.manage`. (`manage` is a reserved
 * path segment, declared before `:slug`.) Thin (U5).
 */
@Controller('content/portfolio')
export class PortfolioController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(portfolioListQuerySchema))
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    // Public path: force published — a client can never request drafts (N7).
    return this.forwardPublic(
      CONTENT_PORTFOLIO_LIST,
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
    @Query(new ZodValidationPipe(portfolioListQuerySchema))
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    // Admin path: honors the supplied `status` (or omits it to see every project).
    return this.forward(CONTENT_PORTFOLIO_LIST, query, identity, locale);
  }

  @Get(':slug')
  async get(
    @RequestLocale() locale: Locale,
    @Param('slug') slug: string,
  ): Promise<PortfolioProjectItem> {
    return this.forwardPublic(CONTENT_PORTFOLIO_GET, { slug }, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(portfolioCreateSchema))
    body: PortfolioCreateRequest,
  ): Promise<PortfolioProjectItem> {
    return this.forward(CONTENT_PORTFOLIO_CREATE, body, identity, locale);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_PORTFOLIO_REORDER, body, identity, locale);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(portfolioUpdateSchema.omit({ id: true })))
    body: Omit<PortfolioUpdateRequest, 'id'>,
  ): Promise<PortfolioProjectItem> {
    return this.forward(
      CONTENT_PORTFOLIO_UPDATE,
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
    return this.forward(CONTENT_PORTFOLIO_DELETE, { id }, identity, locale);
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
