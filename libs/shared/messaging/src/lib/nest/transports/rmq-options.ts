import { Transport, type RmqOptions } from '@nestjs/microservices';

/** Default unacked-message window per consumer (MS6). */
export const DEFAULT_PREFETCH_COUNT = 10;

/** What a service/gateway needs to connect to RabbitMQ (from its env accessor). */
export interface RmqConnectionConfig {
  /** The broker URL, e.g. `amqp://user:pass@rabbitmq:5672`. */
  url: string;
  /** The target queue (use `commandsQueue`/`eventsQueue` for the convention). */
  queue: string;
  /** Optional prefetch override for the consumer side. */
  prefetchCount?: number;
  /**
   * Broker-side auto-ack. **Request/reply COMMAND queues must set `true`** — NestJS does NOT
   * auto-ack a `@MessagePattern` under `noAck:false`, so without it every handled command stays
   * unacknowledged and after `prefetchCount` (10) the consumer stalls ("Upstream service error").
   * The reply IS the acknowledgement for RPC, and auto-ack avoids redelivering a half-done write.
   * **EVENT queues keep `false`** (the default) and ack manually for exactly-once redelivery (MS6).
   */
  noAck?: boolean;
}

/** The request/reply (commands) queue for a service: `<service>.commands`. */
export const commandsQueue = (service: string): string => `${service}.commands`;

/** The events queue for a service: `<service>.events`. */
export const eventsQueue = (service: string): string => `${service}.events`;

/**
 * RMQ transport for the **consumer** side (`NestFactory.createMicroservice` /
 * `connectMicroservice`). Manual ack + durable queue + bounded prefetch so delivery
 * is safe and idempotent consumers can do their work (MS6).
 */
export function createRmqServerOptions(
  config: RmqConnectionConfig,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [config.url],
      queue: config.queue,
      // Commands pass `noAck:true` (auto-ack); events default to manual ack (MS6). See the
      // `noAck` doc on RmqConnectionConfig — the un-acked-command stall is why this exists.
      noAck: config.noAck ?? false,
      prefetchCount: config.prefetchCount ?? DEFAULT_PREFETCH_COUNT,
      queueOptions: { durable: true },
    },
  };
}

/**
 * RMQ transport for the **client** side (the gateway's `ClientProxy`). Durable queue
 * so the broker survives restarts; the caller adds `timeout()` per request (MS2).
 */
export function createRmqClientOptions(
  config: RmqConnectionConfig,
): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [config.url],
      queue: config.queue,
      queueOptions: { durable: true },
    },
  };
}
