import { Logger } from '@nestjs/common';
import { EmailProvider, type EmailMessage } from './email.provider.js';

/**
 * The default email provider when SMTP is unconfigured (dev-safe). Logs the email instead of
 * sending — so the notification flow still completes "exactly once" (the durable record is
 * the notification row; the in-app notice is unaffected). Mirrors media's "boots
 * unconfigured" stance, but logs rather than 503 since this path is event-driven, not a
 * user request.
 */
export class ConsoleEmailProvider extends EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `[email:console] to=${message.to} subject="${message.subject}"`,
    );
    return Promise.resolve();
  }
}
