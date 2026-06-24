import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { CacheModule } from '@sanad/cache';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import { createRmqClientOptions, eventsQueue } from '@sanad/messaging';
import { schema } from './db/schema/index.js';
import { SETTINGS_ENV, loadSettingsEnv } from './env.js';
import { HealthController } from './health/health.controller.js';
import { BrandingService } from './settings/application/branding.service.js';
import { SettingsResolver } from './settings/application/settings.resolver.js';
import { SettingRepository } from './settings/infrastructure/setting.repository.js';
import { SettingValueRepository } from './settings/infrastructure/setting-value.repository.js';
import { SettingTranslationRepository } from './settings/infrastructure/setting-translation.repository.js';
import { BrandingMessageController } from './settings/presentation/branding.message-controller.js';
import { SettingsMessageController } from './settings/presentation/settings.message-controller.js';
import {
  OutboxRelayService,
  SETTINGS_EVENTS_CLIENT,
} from './outbox/outbox-relay.service.js';
import { SeedService } from './seed/seed.service.js';

// Read + validate env once at module load (U19); used for DB/broker/cache wiring.
const env = loadSettingsEnv();

/**
 * The settings service root. Wires its own DB (DrizzleModule, MS5), the Redis cache
 * (CacheModule), the events ClientProxy for the Outbox relay (MS3), and the branding/
 * settings/health surfaces. RMQ command handling is connected in `main.ts` (hybrid app).
 */
@Module({
  imports: [
    DrizzleModule.forRoot({ connectionString: env.DATABASE_URL, schema }),
    CacheModule.forRoot({ url: env.REDIS_URL }),
    ClientsModule.register([
      {
        name: SETTINGS_EVENTS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: eventsQueue('settings'),
        }),
      },
    ]),
  ],
  controllers: [
    BrandingMessageController,
    SettingsMessageController,
    HealthController,
  ],
  providers: [
    { provide: SETTINGS_ENV, useValue: env },
    { provide: DateTimeService, useFactory: () => new DateTimeService() },
    SettingRepository,
    SettingValueRepository,
    SettingTranslationRepository,
    SettingsResolver,
    BrandingService,
    SeedService,
    OutboxRelayService,
  ],
})
export class AppModule {}
