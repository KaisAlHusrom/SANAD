import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { JwtTokenVerifier, TokenVerifier } from '@sanad/auth';
import { commandsQueue, createRmqClientOptions } from '@sanad/messaging';
import { loadGatewayEnv } from '../env.js';
import {
  CONTENT_CLIENT,
  IDENTITY_CLIENT,
  MEDIA_CLIENT,
  NOTIFICATIONS_CLIENT,
  SETTINGS_CLIENT,
} from './injection-tokens.js';

// Validate env once at module load (U19); used to wire the RMQ client + verifier.
const env = loadGatewayEnv();

/**
 * Global core: the RMQ client to the identity service (MS2) and the RS256
 * `TokenVerifier` the guards use (decision 2). Exported so every feature module's
 * controllers/guards resolve them.
 */
@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: IDENTITY_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('identity'),
        }),
      },
      {
        name: SETTINGS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('settings'),
        }),
      },
      {
        name: MEDIA_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('media'),
        }),
      },
      {
        name: CONTENT_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('content'),
        }),
      },
      {
        name: NOTIFICATIONS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('notifications'),
        }),
      },
    ]),
  ],
  providers: [
    {
      provide: TokenVerifier,
      useFactory: () => new JwtTokenVerifier({ publicKey: env.JWT_PUBLIC_KEY }),
    },
  ],
  exports: [TokenVerifier, ClientsModule],
})
export class CoreModule {}
