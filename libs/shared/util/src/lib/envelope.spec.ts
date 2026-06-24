import { describe, expect, it } from 'vitest';
import { httpEnvelopeSchema } from '@sanad/contracts';
import { z } from 'zod';
import { fail, failHttp, ok, toHttpEnvelope } from './envelope.js';

const PATH = '/api/things';
const TS = '2026-06-22T10:00:00.000Z';

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

describe('http envelope (N9 5-field)', () => {
  it('wraps a raw value and stamps path + timestamp', () => {
    const env = toHttpEnvelope({ id: 1 }, PATH, TS);
    expect(env).toEqual({
      success: true,
      message: 'OK',
      data: { id: 1 },
      path: PATH,
      timestamp: TS,
    });
    expect(
      httpEnvelopeSchema(z.object({ id: z.number() })).safeParse(env).success,
    ).toBe(true);
  });

  it('enriches an existing core envelope instead of double-wrapping', () => {
    const env = toHttpEnvelope(ok({ id: 2 }, 'created'), PATH, TS);
    expect(env.message).toBe('created');
    expect(env.data).toEqual({ id: 2 });
    expect(env.path).toBe(PATH);
  });

  it('builds a 5-field error envelope', () => {
    const env = failHttp('boom', PATH, TS);
    expect(env).toEqual({
      success: false,
      message: 'boom',
      data: null,
      path: PATH,
      timestamp: TS,
    });
  });
});
