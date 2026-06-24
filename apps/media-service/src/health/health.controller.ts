import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { ResponseEnvelope } from '@sanad/contracts';
import { DRIZZLE } from '@sanad/database';
import { ok } from '@sanad/util';
import type { MediaDb } from '../db/schema/index.js';

interface HealthStatus {
  status: 'ok' | 'error';
  db: 'up' | 'down';
}

/**
 * Internal liveness/readiness for the media service (MS8) — the container health check
 * curls this. Pings the DB so readiness reflects the dependency it owns (MS5).
 */
@Controller()
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: MediaDb) {}

  @Get('health')
  async check(): Promise<ResponseEnvelope<HealthStatus>> {
    let db: 'up' | 'down' = 'up';
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      db = 'down';
    }
    return ok({ status: db === 'up' ? 'ok' : 'error', db });
  }
}
