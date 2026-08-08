import { Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import type {
  IntegrationProviderId,
  IntegrationTestResult,
  Locale,
} from '@sanad/contracts';
import type { DateTimeService } from '@sanad/database';
import { translate } from '@sanad/i18n';
// nodemailer is CJS — default-import the module object (N12); the type comes via import type.
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { NotificationsEnv } from '../../../env.js';
import { ConsoleEmailProvider } from './console-email.provider.js';
import { EmailProvider, type EmailMessage } from './email.provider.js';
import { resolveEmailConfig, type SmtpConfig } from './smtp-credentials.js';

/**
 * How long a resolved email config is cached before re-resolving (ms). Mirrors media's storage
 * TTL so an admin change takes effect without a restart — the previous implementation resolved
 * the password exactly ONCE per process, which meant a rotated secret needed a redeploy.
 */
export const EMAIL_CONFIG_TTL_MS = 60_000;

/** A stable identity for a config — so the transport is rebuilt only on a real change. */
function fingerprintOf(provider: IntegrationProviderId, c: SmtpConfig): string {
  return [
    provider,
    c.host,
    String(c.port),
    String(c.secure),
    c.user ?? '',
    c.password ?? '',
    c.from,
  ].join('|');
}

/**
 * Sends email over SMTP (nodemailer). The whole config (host/port/secure/user/password/from)
 * resolves **vault → env** through `resolveEmailConfig` and is cached for
 * {@link EMAIL_CONFIG_TTL_MS}, rebuilding the transport only when it actually changes — so the
 * owner can configure email from the Integrations page with no restart. When it isn't fully
 * configured the message is delegated to the console provider (dev-safe: the notification row
 * remains the durable record).
 */
export class SmtpEmailProvider extends EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly fallback = new ConsoleEmailProvider();
  private transporter: Transporter | null = null;
  private from = '';
  private fingerprint: string | null = null;
  private nextRefreshAtMs = 0;

  constructor(
    private readonly env: NotificationsEnv,
    private readonly settingsClient: ClientProxy,
    private readonly clock: DateTimeService,
  ) {
    super();
  }

  /** Re-resolve when the TTL expires; rebuild the transport only if the config changed. */
  private async refresh(): Promise<void> {
    const nowMs = this.clock.nowMillis();
    if (this.fingerprint !== null && nowMs < this.nextRefreshAtMs) {
      return;
    }
    const resolved = await resolveEmailConfig(this.settingsClient, this.env);
    this.nextRefreshAtMs = nowMs + EMAIL_CONFIG_TTL_MS;
    const next = resolved
      ? fingerprintOf(resolved.provider, resolved.config)
      : '';
    if (next === this.fingerprint) {
      return;
    }
    this.fingerprint = next;
    if (!resolved) {
      this.transporter = null;
      this.from = '';
      this.logger.warn(
        'Email is not fully configured — messages will be logged, not sent.',
      );
      return;
    }
    this.transporter = nodemailer.createTransport(
      buildTransportOptions(resolved.config),
    );
    this.from = resolved.config.from;
  }

  async send(message: EmailMessage): Promise<void> {
    await this.refresh();
    if (!this.transporter) {
      await this.fallback.send(message);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }

  /**
   * Prove a provider's settings with a real transport `verify()` BEFORE the owner activates it —
   * resolves that specific provider and uses a throwaway transport, so testing never disturbs the
   * live one.
   *
   * The message is rendered HERE, in the caller's locale (U24d) — it travels inside the payload,
   * out of reach of the gateway's envelope renderer. A transport failure keeps nodemailer's raw
   * text (`ENOTFOUND`, `EAUTH`) in `detail` under the localized line (U24e).
   */
  async testConnection(
    provider: IntegrationProviderId,
    locale: Locale,
  ): Promise<IntegrationTestResult> {
    const resolved = await resolveEmailConfig(
      this.settingsClient,
      this.env,
      provider,
    );
    if (!resolved) {
      return {
        ok: false,
        message: translate('notifications.test.missingFields', locale),
      };
    }
    const probe = nodemailer.createTransport(
      buildTransportOptions(resolved.config),
    );
    try {
      await probe.verify();
      return {
        ok: true,
        message: translate('notifications.test.connected', locale, {
          host: resolved.config.host,
          port: resolved.config.port,
        }),
      };
    } catch (error) {
      return {
        ok: false,
        message: translate('notifications.test.failed', locale),
        ...(error instanceof Error && error.message
          ? { detail: error.message }
          : {}),
      };
    } finally {
      probe.close();
    }
  }
}

/** Map our resolved config onto nodemailer's transport options (auth only when a user is set). */
function buildTransportOptions(config: SmtpConfig) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user
      ? { user: config.user, pass: config.password ?? '' }
      : undefined,
  };
}
