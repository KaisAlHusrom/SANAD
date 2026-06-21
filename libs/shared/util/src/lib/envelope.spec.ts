import { describe, expect, it } from 'vitest';
import { fail, ok } from './envelope.js';

describe('envelope builders', () => {
  it('wraps data in a success envelope', () => {
    const env = ok({ id: 1 }, 'created');
    expect(env).toEqual({ success: true, message: 'created', data: { id: 1 } });
  });

  it('builds a failure envelope with null data', () => {
    const env = fail('not found');
    expect(env.success).toBe(false);
    expect(env.data).toBeNull();
  });
});
