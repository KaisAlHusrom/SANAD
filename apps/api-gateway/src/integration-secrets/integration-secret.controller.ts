import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
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
  secretKeySchema,
  setSecretRequestSchema,
  SECRET_PERMISSIONS,
  SETTINGS_SECRET_SET,
  SETTINGS_SECRET_STATUS,
  type SecretKey,
  type SecretStatus,
  type SetSecretRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { SETTINGS_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';
import { SecretPermissionGuard } from './guards/index.js';

/**
 * The integration-secret admin surface (N13 — "gated per-integration"). Reading the masked
 * statuses needs `settings.secrets.read`; set/rotate is gated per third party by the
 * `SecretPermissionGuard` (the `:key`'s `settings.secrets.<feature>.manage`). Responses are
 * **masked** only — never a decrypted value (the `settings.resolve-secret` resolve path is
 * internal-only and has no gateway route).
 */
@Controller('integration-secrets')
export class IntegrationSecretController {
  constructor(@Inject(SETTINGS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(SECRET_PERMISSIONS.read)
  async status(
    @CurrentUser() identity: IdentityContext,
  ): Promise<SecretStatus[]> {
    try {
      return await sendRequest<SecretStatus[]>(
        this.client,
        SETTINGS_SECRET_STATUS,
        {},
        { headers: identityToHeaders(identity) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, SecretPermissionGuard)
  async set(
    @CurrentUser() identity: IdentityContext,
    @Param('key', new ZodValidationPipe(secretKeySchema)) key: SecretKey,
    @Body(new ZodValidationPipe(setSecretRequestSchema)) body: SetSecretRequest,
  ): Promise<SecretStatus> {
    try {
      return await sendRequest<SecretStatus>(
        this.client,
        SETTINGS_SECRET_SET,
        { key, value: body.value },
        { headers: identityToHeaders(identity) },
      );
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
