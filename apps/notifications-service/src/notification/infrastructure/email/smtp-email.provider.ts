import { Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
// nodemailer is CJS — default-import the module object (N12); the type comes via import type.
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { NotificationsEnv } from '../../../env.js';
import { EmailProvider, type EmailMessage } from './email.provider.js';
import { resolveSmtpPassword } from './smtp-credentials.js';

/**
 * Sends email over SMTP (nodemailer). The transport is built lazily on first send — the SMTP
 * password resolves from the settings vault → env (N13), so we avoid a boot-time dependency
 * on the settings service. If the host or password is missing the email is logged rather
 * than sent (the notification row stays the durable record; a future sweeper can retry).
 */
export class SmtpEmailProvider extends EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: Transporter | null = null;
  private resolved = false;

  constructor(
    private readonly env: NotificationsEnv,
    private readonly settingsClient: ClientProxy,
  ) {
    super();
  }

  private async ensureTransporter(): Promise<Transporter | null> {
    if (this.resolved) {
      return this.transporter;
    }
    this.resolved = true;
    const password = await resolveSmtpPassword(this.settingsClient, this.env);
    if (!this.env.SMTP_HOST || !password) {
      this.logger.warn(
        'SMTP host/password not fully configured — emails will be logged, not sent.',
      );
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host: this.env.SMTP_HOST,
      port: this.env.SMTP_PORT,
      secure: this.env.SMTP_SECURE,
      auth: this.env.SMTP_USER
        ? { user: this.env.SMTP_USER, pass: password }
        : undefined,
    });
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    const transporter = await this.ensureTransporter();
    if (!transporter) {
      this.logger.log(
        `[email:unsent] to=${message.to} subject="${message.subject}"`,
      );
      return;
    }
    await transporter.sendMail({
      from: this.env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
