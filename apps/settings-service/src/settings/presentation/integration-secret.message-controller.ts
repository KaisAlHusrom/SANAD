import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { identityFromHeaders } from '@sanad/auth';
import {
  secretResolvePayloadSchema,
  secretSetPayloadSchema,
  SETTINGS_RESOLVE_SECRET,
  SETTINGS_SECRET_SET,
  SETTINGS_SECRET_STATUS,
  type SecretResolvePayload,
  type SecretSetPayload,
  type SecretStatus,
} from '@sanad/contracts';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { SecretsService } from '../application/secrets.service.js';

/**
 * RMQ entrypoints for the integration-secret vault (MS2, N13). Thin — validate + delegate
 * (U5). `resolve` is INTERNAL only (no gateway route) and returns the decrypted value over
 * the broker to a server-side consumer; `set`/`status` back the masked admin surface, which
 * the gateway guards with `settings.manage` and whose identity it forwards in headers (MS4).
 */
@Controller()
export class IntegrationSecretMessageController {
  constructor(private readonly secrets: SecretsService) {}

  @MessagePattern(SETTINGS_RESOLVE_SECRET)
  resolve(
    @Payload(new ZodValidationPipe(secretResolvePayloadSchema))
    payload: SecretResolvePayload,
  ): Promise<string | null> {
    return this.secrets.resolveSecret(payload.key);
  }

  @MessagePattern(SETTINGS_SECRET_STATUS)
  status(): Promise<SecretStatus[]> {
    return this.secrets.getStatuses();
  }

  @MessagePattern(SETTINGS_SECRET_SET)
  set(
    @Payload(new ZodValidationPipe(secretSetPayloadSchema))
    payload: SecretSetPayload,
    @Ctx() context: RmqContext,
  ): Promise<SecretStatus> {
    const identity = identityFromHeaders(readMessageHeaders(context));
    return this.secrets.setSecret(
      payload.key,
      payload.value,
      identity?.userId ?? null,
    );
  }
}
