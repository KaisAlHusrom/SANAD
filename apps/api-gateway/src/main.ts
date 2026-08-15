import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DateTimeService } from '@sanad/database';
import { AllExceptionsFilter, ResponseEnvelopeInterceptor } from '@sanad/util';
import { AppModule } from './app.module.js';
import { requestContextMiddleware } from './core/middlewares/index.js';
import { loadGatewayEnv } from './env.js';

/**
 * Gateway entrypoint. Reads + validates env once (fails fast, U19), applies the
 * single response envelope + error filter (N9), enables graceful shutdown so
 * in-flight work drains on rollover (MS8), and serves behind nginx under `/api`.
 * `reflect-metadata` MUST be the first import for Nest DI.
 */
async function bootstrap(): Promise<void> {
  const env = loadGatewayEnv();
  const app = await NestFactory.create(AppModule);

  const clock = new DateTimeService();
  app.setGlobalPrefix('api');
  // FIRST: opens the request-context scope (ip / user-agent / request id) that `forwardHeaders`
  // reads, so every downstream RMQ call carries it (P8.8). Express middleware, not a Nest
  // interceptor — an interceptor's `next.handle()` is subscribed after it returns, outside the scope.
  app.use(requestContextMiddleware);
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor(clock));
  app.useGlobalFilters(new AllExceptionsFilter(clock));
  app.enableShutdownHooks();

  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
