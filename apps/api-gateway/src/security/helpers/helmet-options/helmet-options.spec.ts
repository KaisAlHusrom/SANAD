import { describe, expect, it } from 'vitest';
import { helmetOptions } from './helmet-options.js';

const envFor = (
  APP_ENV: 'development' | 'staging' | 'production',
  origins: string[] = [],
) => ({ APP_ENV, CORS_ALLOWED_ORIGINS: origins });

describe('helmetOptions', () => {
  // The gateway answers JSON and never a document, so it can deny every content directive
  // outright — this CSP is a backstop for a browser that somehow renders a response body.
  it('denies every content source — the gateway serves no documents', () => {
    const csp = helmetOptions(envFor('production')).contentSecurityPolicy;
    expect(csp).toMatchObject({
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
      },
    });
  });

  /**
   * HSTS from `http://localhost:8190` would tell the browser to force https on **localhost**
   * for six months — breaking every other project on this machine, not just this one.
   */
  it('does not send HSTS in development', () => {
    expect(helmetOptions(envFor('development')).hsts).toBe(false);
  });

  it('sends HSTS in staging and production', () => {
    for (const env of ['staging', 'production'] as const) {
      expect(helmetOptions(envFor(env)).hsts).toMatchObject({
        maxAge: 15_552_000,
        includeSubDomains: true,
      });
    }
  });

  // CORP is the one helmet default that can break a legitimately cross-origin browser fetch,
  // so it tracks the CORS allow-list rather than being pinned.
  it('keeps resources same-origin unless an origin has been allow-listed', () => {
    expect(
      helmetOptions(envFor('production')).crossOriginResourcePolicy,
    ).toMatchObject({ policy: 'same-origin' });
    expect(
      helmetOptions(envFor('production', ['https://admin.x.com']))
        .crossOriginResourcePolicy,
    ).toMatchObject({ policy: 'cross-origin' });
  });

  it('leaves COEP off and leaks no referrer', () => {
    const options = helmetOptions(envFor('production'));
    expect(options.crossOriginEmbedderPolicy).toBe(false);
    expect(options.referrerPolicy).toMatchObject({ policy: 'no-referrer' });
  });
});
