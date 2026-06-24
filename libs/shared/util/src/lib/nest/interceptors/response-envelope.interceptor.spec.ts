import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { firstValueFrom, of, type Observable } from 'rxjs';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor.js';

const clock = { nowIso: () => '2026-06-22T10:00:00.000Z' };

function context(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ url }) }),
  } as unknown as ExecutionContext;
}

function handler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

async function run(
  interceptor: NestInterceptor,
  url: string,
  value: unknown,
): Promise<HttpResponseEnvelope<unknown>> {
  const result = interceptor.intercept(
    context(url),
    handler(value),
  ) as Observable<HttpResponseEnvelope<unknown>>;
  return firstValueFrom(result);
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps a raw value in the 5-field envelope', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(interceptor, '/api/x', { id: 1 });
    expect(env).toEqual({
      success: true,
      message: 'OK',
      data: { id: 1 },
      path: '/api/x',
      timestamp: '2026-06-22T10:00:00.000Z',
    });
  });

  it('enriches an already-wrapped envelope without double-wrapping', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(interceptor, '/api/y', {
      success: true,
      message: 'created',
      data: { id: 2 },
    });
    expect(env.message).toBe('created');
    expect(env.data).toEqual({ id: 2 });
    expect(env.path).toBe('/api/y');
  });
});
