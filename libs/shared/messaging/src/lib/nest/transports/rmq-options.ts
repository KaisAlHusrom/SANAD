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
      noAck: false,
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
