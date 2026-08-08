import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  integrationTestPayloadSchema,
  MEDIA_STORAGE_CORS_APPLY,
  MEDIA_STORAGE_CORS_STATUS,
  type IntegrationTestPayload,
  type StorageCorsStatus,
} from '@sanad/contracts';
import { resolveRequestLocale } from '@sanad/i18n';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { StorageProvider } from '../infrastructure/storage/storage.provider.js';

/**
 * The browser-CORS surface for storage (MS2). Sibling of `StorageTestMessageController` and
 * here for the same reason: media-service owns the S3 adapter, settings-service only stores the
 * config (MS1).
 *
 * It exists because credentials and CORS fail **independently** — "Test connection" can pass
 * while every browser upload 403s in preflight, which is exactly the bug the owner hit
 * (rules change-log 2026-07-20). Thin: validate + delegate (U5). Neither handler throws for a
 * storage-side refusal; a refusal is a *state* the admin renders, not an exception (U23).
 *
 * That state's explanation is part of the PAYLOAD, so the gateway's envelope renderer can't
 * localize it — the caller's locale is read off the forwarded RMQ headers and passed down, and
 * the vendor's own words ride separately in `detail` (U24d/e, MS4).
 */
@Controller()
export class StorageCorsMessageController {
  constructor(private readonly storage: StorageProvider) {}

  @MessagePattern(MEDIA_STORAGE_CORS_STATUS)
  status(
    @Payload(new ZodValidationPipe(integrationTestPayloadSchema))
    payload: IntegrationTestPayload,
    @Ctx() context: RmqContext,
  ): Promise<StorageCorsStatus> {
    return this.storage.corsStatus(
      resolveRequestLocale(readMessageHeaders(context)),
      payload.provider,
    );
  }

  @MessagePattern(MEDIA_STORAGE_CORS_APPLY)
  apply(
    @Payload(new ZodValidationPipe(integrationTestPayloadSchema))
    payload: IntegrationTestPayload,
    @Ctx() context: RmqContext,
  ): Promise<StorageCorsStatus> {
    return this.storage.applyCors(
      resolveRequestLocale(readMessageHeaders(context)),
      payload.provider,
    );
  }
}
