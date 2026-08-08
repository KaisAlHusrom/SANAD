import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { firstValueFrom, of, type Observable } from 'rxjs';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { LOCALE_HEADER } from '@sanad/i18n';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor.js';

const clock = { nowIso: () => '2026-06-22T10:00:00.000Z' };

function context(
  url: string,
  headers: Record<string, string> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ url, headers }) }),
  } as unknown as ExecutionContext;
}

function handler(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

async function run(
  interceptor: NestInterceptor,
  url: string,
  value: unknown,
  headers: Record<string, string> = {},
): Promise<HttpResponseEnvelope<unknown>> {
  const result = interceptor.intercept(
    context(url, headers),
    handler(value),
  ) as Observable<HttpResponseEnvelope<unknown>>;
  return firstValueFrom(result);
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps a raw value and renders the default message in Arabic (U8/U24)', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(interceptor, '/api/x', { id: 1 });
    expect(env).toEqual({
      success: true,
      message: 'تم',
      data: { id: 1 },
      path: '/api/x',
      timestamp: '2026-06-22T10:00:00.000Z',
    });
  });

  it('renders the default message in English when the caller asked for en', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(
      interceptor,
      '/api/x',
      { id: 1 },
      {
        [LOCALE_HEADER]: 'en',
      },
    );
    expect(env.message).toBe('OK');
  });

  it('renders an already-wrapped envelope’s KEY without double-wrapping', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(
      interceptor,
      '/api/y',
      { success: true, message: 'common.created', data: { id: 2 } },
      { [LOCALE_HEADER]: 'en' },
    );
    expect(env.message).toBe('Created successfully');
    expect(env.data).toEqual({ id: 2 });
    expect(env.path).toBe('/api/y');
  });

  it('falls back to Accept-Language when the app header is absent', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(clock);
    const env = await run(
      interceptor,
      '/api/x',
      { id: 1 },
      {
        'accept-language': 'en-GB,en;q=0.9',
      },
    );
    expect(env.message).toBe('OK');
  });
});
