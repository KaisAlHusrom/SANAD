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
import { loadContentEnv } from './env.js';

/**
 * Content service entrypoint — a HYBRID app: an HTTP server for the internal health
 * endpoint plus an RMQ microservice consuming `content.commands` (MS2) AND `content.events`
 * (the `media.deleted` consumer, MS6). The HTTP-only envelope interceptor/filter are NOT
 * inherited by the microservices, so RMQ replies stay raw payloads. `reflect-metadata`
 * MUST be first (Nest DI).
 */
async function bootstrap(): Promise<void> {
  const env = loadContentEnv();
  const app = await NestFactory.create(AppModule);

  const clock = new DateTimeService();
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(clock));
  app.useGlobalFilters(new AllExceptionsFilter(clock));

  // Commands (request/reply) — content.commands.
  app.connectMicroservice(
    createRmqServerOptions({
      url: env.RABBITMQ_URL,
      queue: commandsQueue('content'),
      noAck: true, // RPC: auto-ack — Nest won't ack a @MessagePattern, else the consumer stalls.
    }),
  );
  // Domain events from media (idempotent consumer, MS6). The relay emits `media.deleted`
  // onto the producer's `media.events` queue (clientProxyPublisher sends only the payload);
  // content is the sole subscriber, so it listens there directly. A multi-consumer fanout
  // (topic exchange) is a future @sanad/messaging concern.
  app.connectMicroservice(
    createRmqServerOptions({
      url: env.RABBITMQ_URL,
      queue: eventsQueue('media'),
    }),
  );

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
