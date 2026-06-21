import { Injectable } from '@nestjs/common';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthReporter } from './health.reporter.js';
import type { HealthStatus } from './health-status.type.js';

/** Heap ceiling for the liveness probe (bootstrap default; tune per-service later). */
const HEAP_LIMIT_BYTES = 512 * 1024 * 1024;

/**
 * Terminus-backed liveness/readiness (MS8). For the P1 bootstrap the only indicator
 * is process heap; service/broker/DB indicators are added with their wiring in P2+.
 */
@Injectable()
export class TerminusHealthReporter extends HealthReporter {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {
    super();
  }

  async liveness(): Promise<HealthStatus> {
    const result = await this.health.check([
      () => this.memory.checkHeap('memory_heap', HEAP_LIMIT_BYTES),
    ]);
    return { status: result.status };
  }
}
