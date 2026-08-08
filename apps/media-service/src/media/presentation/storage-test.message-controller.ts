import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  integrationTestPayloadSchema,
  MEDIA_STORAGE_TEST,
  type IntegrationTestPayload,
  type IntegrationTestResult,
} from '@sanad/contracts';
import { resolveRequestLocale } from '@sanad/i18n';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { StorageProvider } from '../infrastructure/storage/storage.provider.js';

/**
 * "Test connection" for a STORAGE provider (MS2). Lives here — not in settings-service —
 * because media-service owns the S3 adapter (MS1); settings-service only stores the config.
 * Thin: validate + delegate (U5). Never throws for a bad credential — a failed probe is a
 * normal `{ ok: false, message }` result the admin renders.
 *
 * The probe's message is part of the PAYLOAD, so the gateway's envelope renderer can't localize
 * it — the caller's locale is read off the forwarded RMQ headers and passed down (U24d/MS4).
 */
@Controller()
export class StorageTestMessageController {
  constructor(private readonly storage: StorageProvider) {}

  @MessagePattern(MEDIA_STORAGE_TEST)
  test(
    @Payload(new ZodValidationPipe(integrationTestPayloadSchema))
    payload: IntegrationTestPayload,
    @Ctx() context: RmqContext,
  ): Promise<IntegrationTestResult> {
    return this.storage.testConnection(
      payload.provider,
      resolveRequestLocale(readMessageHeaders(context)),
    );
  }
}
