import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { OutboxRecord, OutboxStore } from '../../outbox.js';

/** Publishes an outbox record to the broker. */
export interface OutboxPublisher {
  publish(record: OutboxRecord): Promise<void>;
}

/** Tuning for the polling relay. */
export interface OutboxRelayOptions {
  batchSize?: number;
  intervalMs?: number;
}

export const DEFAULT_OUTBOX_BATCH_SIZE = 50;
export const DEFAULT_OUTBOX_INTERVAL_MS = 2000;

/** A publisher that emits each record as an event over a `ClientProxy` (MS3). */
export function clientProxyPublisher(client: ClientProxy): OutboxPublisher {
  return {
    async publish(record: OutboxRecord): Promise<void> {
      await firstValueFrom(
        client.emit(record.eventName, JSON.parse(record.payload)),
      );
    },
  };
}

/**
 * The polling relay (MS3): repeatedly pulls unpublished outbox rows, publishes each,
 * and marks it published. A publish failure stops the batch so ordering holds and
 * the row is retried next tick (at-least-once → consumers must be idempotent, MS6).
 * Start it after the app is listening; stop it on shutdown (MS8).
 */
export class OutboxRelay {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly store: OutboxStore,
    private readonly publisher: OutboxPublisher,
    private readonly options: OutboxRelayOptions = {},
  ) {}

  /** Publish one batch; returns how many records were published. */
  async drainOnce(): Promise<number> {
    const batch = await this.store.pullUnpublished(
      this.options.batchSize ?? DEFAULT_OUTBOX_BATCH_SIZE,
    );
    let published = 0;
    for (const record of batch) {
      await this.publisher.publish(record);
      await this.store.markPublished(record.id);
      published += 1;
    }
    return published;
  }

  start(): void {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.drainOnce();
    }, this.options.intervalMs ?? DEFAULT_OUTBOX_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
