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
  CONTENT_FAQ_CREATE,
  CONTENT_FAQ_DELETE,
  CONTENT_FAQ_LIST,
  CONTENT_FAQ_UPDATE,
  CONTENT_PERMISSIONS,
  faqCreateSchema,
  faqListQuerySchema,
  faqUpdateSchema,
  type ContentId,
  type FaqCreateRequest,
  type FaqItem,
  type FaqListQuery,
  type FaqUpdateRequest,
  type Paginated,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The FAQ collection surface (MS4). list is **public** (the website FAQ page); create/update/
 * delete are guarded by `content.manage`. No detail-by-slug route. Thin (U5).
 */
@Controller('content/faqs')
export class FaqController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(faqListQuerySchema)) query: FaqListQuery,
  ): Promise<Paginated<FaqItem>> {
    return this.forwardPublic(CONTENT_FAQ_LIST, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(faqCreateSchema)) body: FaqCreateRequest,
  ): Promise<FaqItem> {
    return this.forward(CONTENT_FAQ_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(faqUpdateSchema.omit({ id: true })))
    body: Omit<FaqUpdateRequest, 'id'>,
  ): Promise<FaqItem> {
    return this.forward(CONTENT_FAQ_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_FAQ_DELETE, { id }, identity);
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
