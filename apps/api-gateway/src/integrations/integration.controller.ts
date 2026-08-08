import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  CurrentUser,
  type IdentityContext,
} from '@sanad/auth';
import {
  integrationActivateRequestSchema,
  integrationCapabilitySchema,
  integrationConfigureRequestSchema,
  integrationProviderIdSchema,
  INTEGRATION_PERMISSIONS,
  MEDIA_STORAGE_CORS_APPLY,
  MEDIA_STORAGE_CORS_STATUS,
  MEDIA_STORAGE_TEST,
  NOTIFICATION_EMAIL_TEST,
  SETTINGS_INTEGRATION_ACTIVATE,
  SETTINGS_INTEGRATION_CONFIGURE,
  SETTINGS_INTEGRATION_STATUS,
  type IntegrationActivateRequest,
  type IntegrationCapability,
  type IntegrationCapabilityStatus,
  type IntegrationConfigureRequest,
  type IntegrationProviderId,
  type IntegrationTestResult,
  type StorageCorsStatus,
  type Locale,
} from '@sanad/contracts';
import { httpError } from '@sanad/i18n';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import {
  MEDIA_CLIENT,
  NOTIFICATIONS_CLIENT,
  SETTINGS_CLIENT,
} from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';
import { IntegrationPermissionGuard } from './guards/index.js';

/**
 * The integrations admin surface (N13) — the capability→providers→active model. Reading the
 * masked catalog needs `settings.integrations.read`; configure/activate/test are gated per
 * capability by the `IntegrationPermissionGuard`. Responses are **masked** only — the decrypted
 * config is internal (`settings.integration.resolve`) and has no gateway route.
 *
 * "Test connection" is routed to the service that OWNS the capability's adapter (storage→media,
 * email→notifications) so settings-service never learns S3/SMTP (MS1).
 */
@Controller('integrations')
export class IntegrationController {
  constructor(
    @Inject(SETTINGS_CLIENT) private readonly settings: ClientProxy,
    @Inject(MEDIA_CLIENT) private readonly media: ClientProxy,
    @Inject(NOTIFICATIONS_CLIENT) private readonly notifications: ClientProxy,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(INTEGRATION_PERMISSIONS.read)
  async status(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
  ): Promise<IntegrationCapabilityStatus[]> {
    try {
      return await sendRequest<IntegrationCapabilityStatus[]>(
        this.settings,
        SETTINGS_INTEGRATION_STATUS,
        {},
        { headers: forwardHeaders(identity, locale) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Put(':capability/active')
  @UseGuards(JwtAuthGuard, IntegrationPermissionGuard)
  async activate(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('capability', new ZodValidationPipe(integrationCapabilitySchema))
    capability: IntegrationCapability,
    @Body(new ZodValidationPipe(integrationActivateRequestSchema))
    body: IntegrationActivateRequest,
  ): Promise<IntegrationCapabilityStatus[]> {
    try {
      return await sendRequest<IntegrationCapabilityStatus[]>(
        this.settings,
        SETTINGS_INTEGRATION_ACTIVATE,
        { capability, provider: body.provider },
        { headers: forwardHeaders(identity, locale) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Put(':capability/:provider')
  @UseGuards(JwtAuthGuard, IntegrationPermissionGuard)
  async configure(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('capability', new ZodValidationPipe(integrationCapabilitySchema))
    capability: IntegrationCapability,
    @Param('provider', new ZodValidationPipe(integrationProviderIdSchema))
    provider: IntegrationProviderId,
    @Body(new ZodValidationPipe(integrationConfigureRequestSchema))
    body: IntegrationConfigureRequest,
  ): Promise<IntegrationCapabilityStatus[]> {
    try {
      return await sendRequest<IntegrationCapabilityStatus[]>(
        this.settings,
        SETTINGS_INTEGRATION_CONFIGURE,
        { capability, provider, values: body.values },
        { headers: forwardHeaders(identity, locale) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /**
   * The browser-CORS surface. A SEPARATE route from "test connection" because the two fail
   * independently: credentials can be perfect while every browser upload 403s in preflight for
   * want of a bucket CORS rule — the owner's reported bug (rules change-log 2026-07-20).
   *
   * It keeps the `:capability` segment (rather than a literal `storage/…`) so
   * `IntegrationPermissionGuard` can read the param and enforce
   * `settings.integrations.storage.manage`; a literal path would leave `params.capability`
   * undefined and the guard would wave the request through. Only `storage` has a bucket, so any
   * other capability is a 400 (`assertStorage`), never a silent no-op.
   */
  @Get(':capability/:provider/cors')
  @UseGuards(JwtAuthGuard, IntegrationPermissionGuard)
  async corsStatus(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('capability', new ZodValidationPipe(integrationCapabilitySchema))
    capability: IntegrationCapability,
    @Param('provider', new ZodValidationPipe(integrationProviderIdSchema))
    provider: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    assertStorage(capability);
    return this.storageCors(
      MEDIA_STORAGE_CORS_STATUS,
      provider,
      identity,
      locale,
    );
  }

  /** Write the CORS policy that unblocks browser uploads, and return the re-checked status. */
  @Post(':capability/:provider/cors')
  @UseGuards(JwtAuthGuard, IntegrationPermissionGuard)
  async applyCors(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('capability', new ZodValidationPipe(integrationCapabilitySchema))
    capability: IntegrationCapability,
    @Param('provider', new ZodValidationPipe(integrationProviderIdSchema))
    provider: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    assertStorage(capability);
    return this.storageCors(
      MEDIA_STORAGE_CORS_APPLY,
      provider,
      identity,
      locale,
    );
  }

  @Post(':capability/:provider/test')
  @UseGuards(JwtAuthGuard, IntegrationPermissionGuard)
  async test(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('capability', new ZodValidationPipe(integrationCapabilitySchema))
    capability: IntegrationCapability,
    @Param('provider', new ZodValidationPipe(integrationProviderIdSchema))
    provider: IntegrationProviderId,
  ): Promise<IntegrationTestResult> {
    const route =
      capability === 'storage'
        ? { client: this.media, pattern: MEDIA_STORAGE_TEST }
        : { client: this.notifications, pattern: NOTIFICATION_EMAIL_TEST };
    try {
      return await sendRequest<IntegrationTestResult>(
        route.client,
        route.pattern,
        { capability, provider },
        { headers: forwardHeaders(identity, locale), timeoutMs: 15000 },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /**
   * Forward a CORS status/apply to media-service, which owns the S3 adapter (MS1/MS2),
   * carrying the validated identity AND the caller's locale (MS4/U24).
   */
  private async storageCors(
    pattern: string,
    provider: IntegrationProviderId,
    identity: IdentityContext,
    locale: Locale,
  ): Promise<StorageCorsStatus> {
    try {
      return await sendRequest<StorageCorsStatus>(
        this.media,
        pattern,
        { capability: 'storage', provider },
        { headers: forwardHeaders(identity, locale), timeoutMs: 15000 },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }
}

/** Only `storage` owns a bucket — any other capability here is a client mistake (400, N7). */
function assertStorage(capability: IntegrationCapability): void {
  if (capability !== 'storage') {
    throw httpError(HttpStatus.BAD_REQUEST, 'settings.corsStorageOnly');
  }
}
