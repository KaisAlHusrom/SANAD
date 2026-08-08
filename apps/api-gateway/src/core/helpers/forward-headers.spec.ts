import { IDENTITY_HEADER } from '@sanad/auth';
import type { IdentityContext } from '@sanad/contracts';
import { LOCALE_HEADER } from '@sanad/i18n';
import { describe, expect, it } from 'vitest';
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
});
