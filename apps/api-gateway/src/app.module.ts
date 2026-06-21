import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';

/**
 * Root gateway module. P1 bootstrap wires only health (MS8). Auth/JWT validation and
 * RMQ request/reply + identity forwarding (MS4) arrive in P2.
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
