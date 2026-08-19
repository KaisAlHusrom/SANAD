import { IDENTITY_HEADER } from '@sanad/auth';
import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_CONTEXT_HEADER,
  REQUEST_ID_HEADER,
  type IdentityContext,
} from '@sanad/contracts';
import { LOCALE_HEADER } from '@sanad/i18n';
import { describe, expect, it } from 'vitest';
import { requestContextMiddleware } from '../../middlewares/request-context/request-context.middleware.js';
import { forwardHeaders } from './forward-headers.js';

const identity: IdentityContext = {
  userId: 'u-1',
  roles: ['admin'],
  permissions: ['settings.integrations.read'],
};

describe('forwardHeaders (MS4 + U24)', () => {
  it('forwards the validated identity AND the caller locale to the service', () => {
    const headers = forwardHeaders(identity, 'en');
    expect(headers[LOCALE_HEADER]).toBe('en');
    expect(JSON.parse(headers[IDENTITY_HEADER] ?? '')).toEqual(identity);
  });

  it('carries Arabic — the default locale — just as explicitly', () => {
    // The service must never have to GUESS the locale; ar is sent, not implied.
    expect(forwardHeaders(identity, 'ar')[LOCALE_HEADER]).toBe('ar');
  });

  it('supports a public (unauthenticated) call: locale only, no identity', () => {
    const headers = forwardHeaders(null, 'ar');
    expect(headers[LOCALE_HEADER]).toBe('ar');
    expect(headers[IDENTITY_HEADER]).toBeUndefined();
  });

  it('carries the caller’s circumstances from the ambient request scope (P8.8)', () => {
    requestContextMiddleware(
      {
        ip: '85.10.1.4',
        headers: { 'user-agent': 'Mozilla/5.0', [REQUEST_ID_HEADER]: 'req-9' },
      } as unknown as Parameters<typeof requestContextMiddleware>[0],
      // The middleware echoes the request id on the response (P8.10.A), so a bare `{}` no
      // longer satisfies it.
      {
        setHeader: () => undefined,
      } as Parameters<typeof requestContextMiddleware>[1],
      () => {
        const headers = forwardHeaders(identity, 'ar');
        expect(JSON.parse(headers[REQUEST_CONTEXT_HEADER] ?? '')).toEqual({
          ip: '85.10.1.4',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-9',
        });
      },
    );
  });

  it('still forwards a context OUTSIDE a request — an empty one, never a missing header', () => {
    const headers = forwardHeaders(null, 'ar');
    expect(JSON.parse(headers[REQUEST_CONTEXT_HEADER] ?? '')).toEqual(
      EMPTY_REQUEST_CONTEXT,
    );
  });
});
