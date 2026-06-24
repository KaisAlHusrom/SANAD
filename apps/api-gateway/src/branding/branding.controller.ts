import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  identityToHeaders,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  type IdentityContext,
} from '@sanad/auth';
import {
  brandingUpdateRequestSchema,
  SETTINGS_BRANDING_GET,
  SETTINGS_BRANDING_UPDATE,
  SETTINGS_PERMISSIONS,
  type BrandingRecord,
  type BrandingUpdateRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { SETTINGS_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The branding surface. `GET /api/branding` is **public** — the website renders it
 * unauthenticated, and it always returns coded defaults when unset (P3 acceptance).
 * `PUT /api/branding` is guarded by `settings.manage` at the edge (MS4) and forwards
 * the validated identity in RMQ headers.
 */
@Controller('branding')
export class BrandingController {
  constructor(@Inject(SETTINGS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async get(): Promise<BrandingRecord> {
    try {
      return await sendRequest<BrandingRecord>(
        this.client,
        SETTINGS_BRANDING_GET,
        { scope: 'global' },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Put()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(SETTINGS_PERMISSIONS.manage)
  async update(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(brandingUpdateRequestSchema))
    body: BrandingUpdateRequest,
  ): Promise<BrandingRecord> {
    try {
      return await sendRequest<BrandingRecord>(
        this.client,
        SETTINGS_BRANDING_UPDATE,
        body,
        { headers: identityToHeaders(identity) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
