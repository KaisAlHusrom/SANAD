import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  type IdentityContext,
} from '@sanad/auth';
import {
  settingsUpdateRequestSchema,
  SETTINGS_CATALOG_GET,
  SETTINGS_SET,
  SETTINGS_PERMISSIONS,
  type SettingsCatalog,
  type SettingsUpdateRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { SETTINGS_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The descriptor-driven settings surface (the admin settings page). `GET /api/settings`
 * returns the whole catalog (groups → sections → fields with descriptors + resolved values),
 * guarded by `settings.read`; `PUT /api/settings` applies a batch of typed key→value writes,
 * guarded by `settings.manage` (MS4 — identity validated at the edge, forwarded in RMQ
 * headers). The website's public `GET /api/branding` is separate and unauthenticated.
 */
@Controller('settings')
export class SettingsController {
  constructor(@Inject(SETTINGS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(SETTINGS_PERMISSIONS.read)
  async getCatalog(@RequestLocale() locale: Locale): Promise<SettingsCatalog> {
    try {
      return await sendRequest<SettingsCatalog>(
        this.client,
        SETTINGS_CATALOG_GET,
        { scope: 'global' },
        { headers: forwardHeaders(null, locale) },
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
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(settingsUpdateRequestSchema))
    body: SettingsUpdateRequest,
  ): Promise<SettingsCatalog> {
    try {
      return await sendRequest<SettingsCatalog>(
        this.client,
        SETTINGS_SET,
        body,
        { headers: forwardHeaders(identity, locale) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
