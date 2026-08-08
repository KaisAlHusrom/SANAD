import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv (website)', () => {
  it('parses a valid environment', () => {
    const env = parseEnv({
      APP_ENV: 'staging',
      gatewayBaseUrl: 'https://api.sanad.tech/api',
    });
    expect(env.APP_ENV).toBe('staging');
    expect(env.gatewayBaseUrl).toBe('https://api.sanad.tech/api');
  });

  it('defaults gatewayBaseUrl to the in-cluster nginx URL when absent', () => {
    // Server-side RSC fetch has no browser origin → the base MUST be absolute (in-cluster).
    expect(parseEnv({ APP_ENV: 'development' }).gatewayBaseUrl).toBe(
      'http://nginx/api',
    );
  });

  it('fails fast on a missing required key', () => {
    expect(() => parseEnv({})).toThrow(/APP_ENV/);
  });

  it('fails fast on an invalid APP_ENV (never NODE_ENV values)', () => {
    expect(() => parseEnv({ APP_ENV: 'test' })).toThrow();
    expect(() => parseEnv({ APP_ENV: 'prod' })).toThrow();
  });

  it('rejects unknown keys (strict)', () => {
    expect(() => parseEnv({ APP_ENV: 'production', NODE_ENV: 'x' })).toThrow();
  });
});
