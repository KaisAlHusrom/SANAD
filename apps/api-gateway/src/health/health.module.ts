import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HealthReporter } from './health.reporter.js';
import { TerminusHealthReporter } from './terminus-health.reporter.js';

/**
 * Wires the public health endpoint. The abstract `HealthReporter` token is bound to
 * the terminus implementation, so the controller depends only on the seam (U5/U1).
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [{ provide: HealthReporter, useClass: TerminusHealthReporter }],
})
export class HealthModule {}
