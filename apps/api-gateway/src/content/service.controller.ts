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
  CONTENT_SERVICE_CREATE,
  CONTENT_SERVICE_DELETE,
  CONTENT_SERVICE_GET,
  CONTENT_SERVICE_LIST,
  CONTENT_SERVICE_REORDER,
  CONTENT_SERVICE_UPDATE,
  reorderRequestSchema,
  serviceCreateSchema,
  serviceListQuerySchema,
  serviceUpdateSchema,
  type ContentId,
  type Paginated,
  type ReorderRequest,
  type ServiceCreateRequest,
  type ServiceItem,
  type ServiceListQuery,
  type ServiceUpdateRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The services collection surface (MS4). list + detail are **public** (the website); create/
 * update/delete are guarded by `content.manage`. Thin (U5).
 */
@Controller('content/services')
export class ServiceController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(serviceListQuerySchema))
    query: ServiceListQuery,
  ): Promise<Paginated<ServiceItem>> {
    return this.forwardPublic(CONTENT_SERVICE_LIST, query, locale);
  }

  @Get(':slug')
  async get(
    @RequestLocale() locale: Locale,
    @Param('slug') slug: string,
  ): Promise<ServiceItem> {
    return this.forwardPublic(CONTENT_SERVICE_GET, { slug }, locale);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(serviceCreateSchema))
    body: ServiceCreateRequest,
  ): Promise<ServiceItem> {
    return this.forward(CONTENT_SERVICE_CREATE, body, identity, locale);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_SERVICE_REORDER, body, identity, locale);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema.omit({ id: true })))
    body: Omit<ServiceUpdateRequest, 'id'>,
  ): Promise<ServiceItem> {
    return this.forward(
      CONTENT_SERVICE_UPDATE,
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
    return this.forward(CONTENT_SERVICE_DELETE, { id }, identity, locale);
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
