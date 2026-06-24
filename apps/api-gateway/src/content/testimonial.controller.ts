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
  CONTENT_TESTIMONIAL_CREATE,
  CONTENT_TESTIMONIAL_DELETE,
  CONTENT_TESTIMONIAL_LIST,
  CONTENT_TESTIMONIAL_UPDATE,
  testimonialCreateSchema,
  testimonialListQuerySchema,
  testimonialUpdateSchema,
  type ContentId,
  type Paginated,
  type TestimonialCreateRequest,
  type TestimonialItem,
  type TestimonialListQuery,
  type TestimonialUpdateRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The testimonials collection surface (MS4). list is **public** (the website); create/update/
 * delete are guarded by `content.manage`. No detail-by-slug route (testimonials are listed).
 * Thin (U5).
 */
@Controller('content/testimonials')
export class TestimonialController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(testimonialListQuerySchema))
    query: TestimonialListQuery,
  ): Promise<Paginated<TestimonialItem>> {
    return this.forwardPublic(CONTENT_TESTIMONIAL_LIST, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(testimonialCreateSchema))
    body: TestimonialCreateRequest,
  ): Promise<TestimonialItem> {
    return this.forward(CONTENT_TESTIMONIAL_CREATE, body, identity);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(testimonialUpdateSchema.omit({ id: true })))
    body: Omit<TestimonialUpdateRequest, 'id'>,
  ): Promise<TestimonialItem> {
    return this.forward(CONTENT_TESTIMONIAL_UPDATE, { id, ...body }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_TESTIMONIAL_DELETE, { id }, identity);
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
