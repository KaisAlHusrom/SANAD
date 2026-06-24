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
  CONTENT_PORTFOLIO_CREATE,
  CONTENT_PORTFOLIO_DELETE,
  CONTENT_PORTFOLIO_GET,
  CONTENT_PORTFOLIO_LIST,
  CONTENT_PORTFOLIO_UPDATE,
  portfolioCreateSchema,
  portfolioListQuerySchema,
  portfolioUpdateSchema,
  type ContentId,
  type Paginated,
  type PortfolioCreateRequest,
  type PortfolioListQuery,
  type PortfolioProjectItem,
  type PortfolioUpdateRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
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
    @Query(new ZodValidationPipe(portfolioListQuerySchema))
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    // Public path: force published — a client can never request drafts (N7).
    return this.forwardPublic(CONTENT_PORTFOLIO_LIST, {
      ...query,
      status: 'published',
    });
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async manageList(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(portfolioListQuerySchema))
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    // Admin path: honors the supplied `status` (or omits it to see every project).
    return this.forward(CONTENT_PORTFOLIO_LIST, query, identity);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string): Promise<PortfolioProjectItem> {
    return this.forwardPublic(CONTENT_PORTFOLIO_GET, { slug });
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(portfolioCreateSchema))
    body: PortfolioCreateRequest,
  ): Promise<PortfolioProjectItem> {
    return this.forward(CONTENT_PORTFOLIO_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(portfolioUpdateSchema.omit({ id: true })))
    body: Omit<PortfolioUpdateRequest, 'id'>,
  ): Promise<PortfolioProjectItem> {
    return this.forward(CONTENT_PORTFOLIO_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_PORTFOLIO_DELETE, { id }, identity);
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
