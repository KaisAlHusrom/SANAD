import { Controller, Get } from '@nestjs/common';
import { ok } from '@sanad/util';
import type { ResponseEnvelope } from '@sanad/contracts';
import { HealthReporter } from './health.reporter.js';
import type { HealthStatus } from './health-status.type.js';

/**
 * Public liveness/readiness endpoint — the only route the gateway exposes in P1 (MS4).
 * Thin by design (U5): it delegates to the HealthReporter and wraps the result in the
 * single response envelope (N9). nginx routes `/api/health` here.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly reporter: HealthReporter) {}

  @Get()
  async check(): Promise<ResponseEnvelope<HealthStatus>> {
    return ok(await this.reporter.liveness());
  }
}
