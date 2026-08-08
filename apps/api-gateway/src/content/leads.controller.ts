import {
  Body,
  Controller,
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
  CONTENT_LEAD_LIST,
  CONTENT_LEAD_SUBMIT,
  CONTENT_LEAD_UPDATE,
  CONTENT_PERMISSIONS,
  leadCreateRequestSchema,
  leadListQuerySchema,
  leadUpdateSchema,
  type Lead,
  type LeadCreateRequest,
  type LeadId,
  type LeadListQuery,
  type LeadUpdateRequest,
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
 * The leads surface (MS4). `POST /api/leads` is **public** (the website contact / request
 * form, unauthenticated) — it persists a lead + emits `lead.created` (MS3). The inbox
 * (list + status update) is guarded by `content.manage`. Thin (U5).
 */
@Controller('leads')
export class LeadsController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  async submit(
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(leadCreateRequestSchema))
    body: LeadCreateRequest,
  ): Promise<LeadId> {
    try {
      return await sendRequest<LeadId>(this.client, CONTENT_LEAD_SUBMIT, body, {
        headers: forwardHeaders(null, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async list(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(leadListQuerySchema)) query: LeadListQuery,
  ): Promise<Paginated<Lead>> {
    return this.forward(CONTENT_LEAD_LIST, query, identity, locale);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(leadUpdateSchema.omit({ id: true })))
    body: Omit<LeadUpdateRequest, 'id'>,
  ): Promise<Lead> {
    return this.forward(CONTENT_LEAD_UPDATE, { id, ...body }, identity, locale);
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
}
