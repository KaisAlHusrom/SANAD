import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DateTimeService } from '@sanad/database';
import { commandsQueue, createRmqServerOptions } from '@sanad/messaging';
import { AllExceptionsFilter, ResponseEnvelopeInterceptor } from '@sanad/util';
import { AppModule } from './app.module.js';
import { loadSettingsEnv } from './env.js';

/**
 * Settings service entrypoint — a HYBRID app: an HTTP server for the internal health
 * endpoint plus an RMQ microservice consuming `settings.commands` (MS2). The HTTP-only
 * envelope interceptor/filter are NOT inherited by the microservice, so RMQ replies
 * stay raw payloads. `reflect-metadata` MUST be first (Nest DI).
 */
async function bootstrap(): Promise<void> {
  const env = loadSettingsEnv();
  const app = await NestFactory.create(AppModule);

  const clock = new DateTimeService();
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(clock));
  app.useGlobalFilters(new AllExceptionsFilter(clock));

  app.connectMicroservice(
    createRmqServerOptions({
      url: env.RABBITMQ_URL,
      queue: commandsQueue('settings'),
    }),
  );

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
