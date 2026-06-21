import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadGatewayEnv } from './env.js';

/**
 * Gateway entrypoint. Reads + validates env once (fails fast, U19), enables graceful
 * shutdown so in-flight work drains on rollover (MS8), and serves behind nginx under
 * the `/api` prefix. `reflect-metadata` MUST be the first import for Nest DI.
 */
async function bootstrap(): Promise<void> {
  const env = loadGatewayEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
}

void bootstrap();
