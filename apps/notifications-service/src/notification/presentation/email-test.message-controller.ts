import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  integrationTestPayloadSchema,
  NOTIFICATION_EMAIL_TEST,
  type IntegrationTestPayload,
  type IntegrationTestResult,
} from '@sanad/contracts';
import { resolveRequestLocale, translate } from '@sanad/i18n';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { EmailProvider } from '../infrastructure/email/email.provider.js';
import { SmtpEmailProvider } from '../infrastructure/email/smtp-email.provider.js';

/**
 * "Test connection" for an EMAIL provider (MS2). Lives here — not in settings-service — because
 * notifications-service owns the SMTP adapter (MS1); settings-service only stores the config.
 * Thin: validate + delegate (U5). A bad credential is a normal `{ ok: false, message }` result,
 * never a thrown error.
 *
 * The probe's message is part of the PAYLOAD, so the gateway's envelope renderer can't localize
 * it — the caller's locale is read off the forwarded RMQ headers and passed down (U24d/MS4).
 */
@Controller()
export class EmailTestMessageController {
  constructor(private readonly email: EmailProvider) {}

  @MessagePattern(NOTIFICATION_EMAIL_TEST)
  test(
    @Payload(new ZodValidationPipe(integrationTestPayloadSchema))
    payload: IntegrationTestPayload,
    @Ctx() context: RmqContext,
  ): Promise<IntegrationTestResult> {
    const locale = resolveRequestLocale(readMessageHeaders(context));
    if (!(this.email instanceof SmtpEmailProvider)) {
      return Promise.resolve({
        ok: false,
        message: translate('settings.test.unsupported', locale),
      });
    }
    return this.email.testConnection(payload.provider, locale);
  }
}
