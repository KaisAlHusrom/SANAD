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
  CONTENT_PORTFOLIO_CATEGORY_CREATE,
  CONTENT_PORTFOLIO_CATEGORY_DELETE,
  CONTENT_PORTFOLIO_CATEGORY_LIST,
  CONTENT_PORTFOLIO_CATEGORY_REORDER,
  CONTENT_PORTFOLIO_CATEGORY_UPDATE,
  portfolioCategoryCreateSchema,
  portfolioCategoryListQuerySchema,
  portfolioCategoryUpdateSchema,
  reorderRequestSchema,
  type ContentId,
  type Paginated,
  type PortfolioCategoryCreateRequest,
  type PortfolioCategoryItem,
  type PortfolioCategoryListQuery,
  type PortfolioCategoryUpdateRequest,
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
 * The portfolio-categories surface (MS4). list is **public** (the work-grid filter); create/
 * update/delete are guarded by `content.manage`. Thin (U5).
 */
@Controller('content/portfolio-categories')
export class PortfolioCategoryController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(portfolioCategoryListQuerySchema))
    query: PortfolioCategoryListQuery,
  ): Promise<Paginated<PortfolioCategoryItem>> {
    return this.forwardPublic(CONTENT_PORTFOLIO_CATEGORY_LIST, query, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(portfolioCategoryCreateSchema))
    body: PortfolioCategoryCreateRequest,
  ): Promise<PortfolioCategoryItem> {
    return this.forward(
      CONTENT_PORTFOLIO_CATEGORY_CREATE,
      body,
      identity,
      locale,
    );
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(
      CONTENT_PORTFOLIO_CATEGORY_REORDER,
      body,
      identity,
      locale,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(
      new ZodValidationPipe(portfolioCategoryUpdateSchema.omit({ id: true })),
    )
    body: Omit<PortfolioCategoryUpdateRequest, 'id'>,
  ): Promise<PortfolioCategoryItem> {
    return this.forward(
      CONTENT_PORTFOLIO_CATEGORY_UPDATE,
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
    return this.forward(
      CONTENT_PORTFOLIO_CATEGORY_DELETE,
      { id },
      identity,
      locale,
    );
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
