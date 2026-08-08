import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { envelopeSchema } from '@sanad/contracts';
import { HealthController } from './health.controller.js';
import type { HealthReporter } from './health.reporter.js';

describe('HealthController', () => {
  it('wraps the reporter liveness in a healthy 3-field envelope (N9)', async () => {
    const reporter: HealthReporter = {
      liveness: async () => ({ status: 'ok' }),
    };
    const controller = new HealthController(reporter);

    const result = await controller.check();

    expect(result.success).toBe(true);
    // The envelope carries a KEY; the response interceptor renders it per locale (U24).
    expect(result.message).toBe('common.ok');
    expect(result.data.status).toBe('ok');

    // Proves the response matches the real, strict envelope contract — not an invented shape (U15).
    const schema = envelopeSchema(z.object({ status: z.string() }));
    expect(schema.safeParse(result).success).toBe(true);
  });
});
