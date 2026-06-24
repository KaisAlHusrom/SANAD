import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import { createRmqClientOptions, eventsQueue } from '@sanad/messaging';
import { schema } from './db/schema/index.js';
import { IDENTITY_ENV, loadIdentityEnv } from './env.js';
import { HealthController } from './health/health.controller.js';
import { AuthService } from './identity/application/auth.service.js';
import { PasswordHasher } from './identity/application/password.hasher.js';
import { TokenService } from './identity/application/token.service.js';
import { UserReadService } from './identity/application/user-read.service.js';
import { RbacRepository } from './identity/infrastructure/rbac.repository.js';
import { RefreshTokenRepository } from './identity/infrastructure/refresh-token.repository.js';
import { UserRepository } from './identity/infrastructure/user.repository.js';
import { AuthMessageController } from './identity/presentation/auth.message-controller.js';
import { UsersMessageController } from './identity/presentation/users.message-controller.js';
import {
  IDENTITY_EVENTS_CLIENT,
  OutboxRelayService,
} from './outbox/outbox-relay.service.js';
import { SeedService } from './seed/seed.service.js';

// Read + validate env once at module load (U19); used for DB + broker wiring.
const env = loadIdentityEnv();

/**
 * The identity service root. Wires its own DB (DrizzleModule, MS5), the events
 * ClientProxy for the Outbox relay (MS3), and the auth/users/health surfaces. RMQ
 * command handling is connected in `main.ts` (hybrid app).
 */
@Module({
  imports: [
    DrizzleModule.forRoot({ connectionString: env.DATABASE_URL, schema }),
    ClientsModule.register([
      {
        name: IDENTITY_EVENTS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: eventsQueue('identity'),
        }),
      },
    ]),
  ],
  controllers: [
    AuthMessageController,
    UsersMessageController,
    HealthController,
  ],
  providers: [
    { provide: IDENTITY_ENV, useValue: env },
    { provide: DateTimeService, useFactory: () => new DateTimeService() },
    UserRepository,
    RbacRepository,
    RefreshTokenRepository,
    TokenService,
    PasswordHasher,
    AuthService,
    UserReadService,
    SeedService,
    OutboxRelayService,
  ],
})
export class AppModule {}
