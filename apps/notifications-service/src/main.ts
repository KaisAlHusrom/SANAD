import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DateTimeService } from '@sanad/database';
import {
  commandsQueue,
  createRmqServerOptions,
  eventsQueue,
} from '@sanad/messaging';
import { AllExceptionsFilter, ResponseEnvelopeInterceptor } from '@sanad/util';
import { AppModule } from './app.module.js';
import { loadNotificationsEnv } from './env.js';

/**
 * Notifications service entrypoint — a HYBRID app: an HTTP server for the internal health
 * endpoint plus two RMQ microservices: `notifications.commands` (the gateway's in-app
 * read/mark-read requests, MS2) and `content.events` (the `lead.created` consumer, MS6 —
 * the relay emits onto the producer's events queue; notifications is the sole subscriber, so
 * it listens there directly). The HTTP-only envelope interceptor/filter are NOT inherited by
 * the microservices, so RMQ replies stay raw payloads. `reflect-metadata` MUST be first.
 */
async function bootstrap(): Promise<void> {
  const env = loadNotificationsEnv();
  const app = await NestFactory.create(AppModule);

  const clock = new DateTimeService();
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(clock));
  app.useGlobalFilters(new AllExceptionsFilter(clock));

  // Commands (request/reply) — notifications.commands.
  app.connectMicroservice(
    createRmqServerOptions({
      url: env.RABBITMQ_URL,
      queue: commandsQueue('notifications'),
      noAck: true, // RPC: auto-ack — Nest won't ack a @MessagePattern, else the consumer stalls.
    }),
  );
  // Domain events from content (idempotent consumers, MS6) — `lead.created` and
  // `lead.resubmitted`. Both ride this one queue, so a new content event needs no binding here.
  app.connectMicroservice(
    createRmqServerOptions({
      url: env.RABBITMQ_URL,
      queue: eventsQueue('content'),
    }),
  );

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
