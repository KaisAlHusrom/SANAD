import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import {
  commandsQueue,
  createRmqClientOptions,
  eventsQueue,
} from '@sanad/messaging';
import { schema } from './db/schema/index.js';
import { SETTINGS_CLIENT } from './core/injection-tokens.js';
import { MEDIA_ENV, loadMediaEnv } from './env.js';
import { HealthController } from './health/health.controller.js';
import { MediaService } from './media/application/media.service.js';
import { MediaFolderService } from './media/application/media-folder.service.js';
import { PendingUploadSweeperService } from './media/application/pending-upload-sweeper.service.js';
import { MediaAssetRepository } from './media/infrastructure/persistence/media-asset.repository.js';
import { MediaAssetTranslationRepository } from './media/infrastructure/persistence/media-asset-translation.repository.js';
import { MediaFolderRepository } from './media/infrastructure/persistence/media-folder.repository.js';
import { R2StorageProvider } from './media/infrastructure/storage/r2-storage.provider.js';
import { StorageProvider } from './media/infrastructure/storage/storage.provider.js';
import { MediaAssetMessageController } from './media/presentation/media-asset.message-controller.js';
import { MediaFolderMessageController } from './media/presentation/media-folder.message-controller.js';
import { MediaUploadMessageController } from './media/presentation/media-upload.message-controller.js';
import { StorageCorsMessageController } from './media/presentation/storage-cors.message-controller.js';
import { StorageTestMessageController } from './media/presentation/storage-test.message-controller.js';
import {
  MEDIA_EVENTS_CLIENT,
  OutboxRelayService,
} from './outbox/outbox-relay.service.js';

// Read + validate env once at module load (U19); used for DB/broker/storage wiring.
const env = loadMediaEnv();

/**
 * The media service root. Wires its own DB (DrizzleModule, MS5), the events ClientProxy
 * for the Outbox relay (MS3), the settings ClientProxy (resolve the R2 credentials/config from
 * the integration-secret vault, MS2/N13), the R2 storage provider (behind the abstract
 * `StorageProvider` seam), and the upload/asset/folder/health surfaces. RMQ command handling is
 * connected in `main.ts` (hybrid app).
 */
@Module({
  imports: [
    DrizzleModule.forRoot({ connectionString: env.DATABASE_URL, schema }),
    ClientsModule.register([
      {
        name: MEDIA_EVENTS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: eventsQueue('media'),
        }),
      },
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
    MediaUploadMessageController,
    MediaAssetMessageController,
    MediaFolderMessageController,
    StorageTestMessageController,
    StorageCorsMessageController,
    HealthController,
  ],
  providers: [
    { provide: MEDIA_ENV, useValue: env },
    { provide: DateTimeService, useFactory: () => new DateTimeService() },
    { provide: StorageProvider, useClass: R2StorageProvider },
    MediaAssetRepository,
    MediaAssetTranslationRepository,
    MediaFolderRepository,
    MediaService,
    MediaFolderService,
    PendingUploadSweeperService,
    OutboxRelayService,
  ],
})
export class AppModule {}
