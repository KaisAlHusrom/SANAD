import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import {
  clientProxyPublisher,
  DrizzleOutboxStore,
  OutboxRelay,
} from '@sanad/messaging';
import type { SettingsDb } from '../db/schema/index.js';

/** DI token for the ClientProxy that publishes settings domain events (MS3). */
export const SETTINGS_EVENTS_CLIENT = 'SETTINGS_EVENTS_CLIENT';

/**
 * Runs the transactional-Outbox relay for this service (MS3): starts polling once the
 * app is up and drains cleanly on shutdown (MS8). Publishes `settings.changed` over
 * the events ClientProxy.
 */
@Injectable()
export class OutboxRelayService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly relay: OutboxRelay;

  constructor(
    @Inject(DRIZZLE) db: SettingsDb,
    clock: DateTimeService,
    @Inject(SETTINGS_EVENTS_CLIENT) client: ClientProxy,
  ) {
    this.relay = new OutboxRelay(
      new DrizzleOutboxStore(db, clock),
      clientProxyPublisher(client),
    );
  }

  onApplicationBootstrap(): void {
    this.relay.start();
  }

  onApplicationShutdown(): void {
    this.relay.stop();
  }
}
