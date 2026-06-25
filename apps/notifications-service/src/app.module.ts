import { Module, type Provider } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import { commandsQueue, createRmqClientOptions } from '@sanad/messaging';
import { schema } from './db/schema/index.js';
import { NOTIFICATIONS_ENV, loadNotificationsEnv } from './env.js';
import { SETTINGS_CLIENT } from './core/injection-tokens.js';
import { HealthController } from './health/health.controller.js';
import {
  LeadNotificationService,
  NotificationQueryService,
} from './notification/application/services/index.js';
import {
  ConsoleEmailProvider,
  EmailProvider,
  SmtpEmailProvider,
} from './notification/infrastructure/email/index.js';
import { LeadCreatedConsumer } from './notification/infrastructure/consumers/index.js';
import {
  NotificationRepository,
  ProcessedMessageRepository,
} from './notification/infrastructure/persistence/repositories/index.js';
import { NotificationMessageController } from './notification/presentation/index.js';
import type { ClientProxy } from '@nestjs/microservices';
import type { NotificationsEnv } from './env.js';

// Read + validate env once at module load (U19); used for DB/broker wiring.
const env = loadNotificationsEnv();

/**
 * Email provider seam (N13): bind SMTP when a host is configured, else the console logger
 * (dev-safe default). The SMTP password resolves lazily from the settings vault → env at
 * send-time, so the binding decision needs only the (sync) host.
 */
const emailProvider: Provider = {
  provide: EmailProvider,
  inject: [NOTIFICATIONS_ENV, SETTINGS_CLIENT],
  useFactory: (cfg: NotificationsEnv, settingsClient: ClientProxy) =>
    cfg.SMTP_HOST
      ? new SmtpEmailProvider(cfg, settingsClient)
      : new ConsoleEmailProvider(),
};

/**
 * The notifications service root. Wires its own DB (DrizzleModule, MS5 — which also provides
 * the N14 `TransactionRunner`), the settings ClientProxy (resolve the SMTP secret, MS2), the
 * `lead.created` consumer (MS6), the in-app read surface, and health. RMQ servers are
 * connected in `main.ts` (hybrid app).
 */
@Module({
  imports: [
    DrizzleModule.forRoot({ connectionString: env.DATABASE_URL, schema }),
    ClientsModule.register([
      {
        name: SETTINGS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('settings'),
        }),
      },
    ]),
  ],
  controllers: [
    LeadCreatedConsumer,
    NotificationMessageController,
    HealthController,
  ],
  providers: [
    { provide: NOTIFICATIONS_ENV, useValue: env },
    { provide: DateTimeService, useFactory: () => new DateTimeService() },
    ProcessedMessageRepository,
    NotificationRepository,
    emailProvider,
    LeadNotificationService,
    NotificationQueryService,
  ],
})
export class AppModule {}
