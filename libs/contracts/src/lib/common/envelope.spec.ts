import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { envelopeSchema } from './envelope.js';

describe('envelope', () => {
  it('validates a wrapped payload', () => {
    const schema = envelopeSchema(z.object({ id: z.string() }));
    const parsed = schema.parse({
      success: true,
      message: 'ok',
      data: { id: 'abc' },
    });
    expect(parsed.data.id).toBe('abc');
  });

  it('rejects a payload missing the envelope keys', () => {
    const schema = envelopeSchema(z.string());
    expect(schema.safeParse({ data: 'x' }).success).toBe(false);
  });
});
