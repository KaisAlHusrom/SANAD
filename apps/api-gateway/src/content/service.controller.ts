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
  CONTENT_SERVICE_CREATE,
  CONTENT_SERVICE_DELETE,
  CONTENT_SERVICE_GET,
  CONTENT_SERVICE_LIST,
  CONTENT_SERVICE_UPDATE,
  serviceCreateSchema,
  serviceListQuerySchema,
  serviceUpdateSchema,
  type ContentId,
  type Paginated,
  type ServiceCreateRequest,
  type ServiceItem,
  type ServiceListQuery,
  type ServiceUpdateRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
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
    @Query(new ZodValidationPipe(serviceListQuerySchema))
    query: ServiceListQuery,
  ): Promise<Paginated<ServiceItem>> {
    return this.forwardPublic(CONTENT_SERVICE_LIST, query);
  }

  @Get(':slug')
  async get(@Param('slug') slug: string): Promise<ServiceItem> {
    return this.forwardPublic(CONTENT_SERVICE_GET, { slug });
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(serviceCreateSchema))
    body: ServiceCreateRequest,
  ): Promise<ServiceItem> {
    return this.forward(CONTENT_SERVICE_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema.omit({ id: true })))
    body: Omit<ServiceUpdateRequest, 'id'>,
  ): Promise<ServiceItem> {
    return this.forward(CONTENT_SERVICE_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_SERVICE_DELETE, { id }, identity);
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
