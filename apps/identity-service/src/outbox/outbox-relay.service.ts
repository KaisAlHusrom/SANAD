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
import type { IdentityDb } from '../db/schema/index.js';

/** DI token for the ClientProxy that publishes identity domain events (MS3). */
export const IDENTITY_EVENTS_CLIENT = 'IDENTITY_EVENTS_CLIENT';

/**
 * Runs the transactional-Outbox relay for this service (MS3): starts polling once the
 * app is up and drains cleanly on shutdown (MS8). The relay publishes enqueued events
 * over the events ClientProxy.
 */
@Injectable()
export class OutboxRelayService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly relay: OutboxRelay;

  constructor(
    @Inject(DRIZZLE) db: IdentityDb,
    clock: DateTimeService,
    @Inject(IDENTITY_EVENTS_CLIENT) client: ClientProxy,
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
