import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('parses a valid environment', () => {
    const env = parseEnv({ APP_ENV: 'staging', apiBaseUrl: 'https://x/api' });
    expect(env.APP_ENV).toBe('staging');
    expect(env.apiBaseUrl).toBe('https://x/api');
  });

  it('defaults apiBaseUrl to /api when absent', () => {
    expect(parseEnv({ APP_ENV: 'development' }).apiBaseUrl).toBe('/api');
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
