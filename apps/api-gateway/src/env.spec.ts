import { describe, expect, it } from 'vitest';
import { loadGatewayEnv } from './env.js';

const base = {
  APP_ENV: 'development',
  RABBITMQ_URL: 'amqp://rabbit:5672',
  JWT_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\\nabc\\n-----END PUBLIC KEY-----',
  REDIS_URL: 'redis://redis:6379',
};

describe('gateway env (P8.10.A)', () => {
  it('parses a development stack and defaults the proxy hop count to one', () => {
    const env = loadGatewayEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.TRUST_PROXY_HOPS).toBe(1);
  });

  // Already injected into the container since P3 — the schema simply ignored it, so a
  // missing Redis would have surfaced as a runtime crash rather than a boot failure.
  it('requires REDIS_URL', () => {
    const { REDIS_URL: _omitted, ...withoutRedis } = base;
    expect(() => loadGatewayEnv(withoutRedis)).toThrow(/REDIS_URL/);
  });

  it('trims and de-duplicates the CORS allow-list', () => {
    expect(
      loadGatewayEnv({
        ...base,
        CORS_ALLOWED_ORIGINS: ' https://admin.x.com , https://admin.x.com ,',
      }).CORS_ALLOWED_ORIGINS,
    ).toEqual(['https://admin.x.com']);
  });

  // Deny by default. The admin is same-origin through nginx and the website fetches
  // server-side, so nothing in the product needs CORS — an allow-list that defaulted to
  // something would only ever be opening a door nobody asked for.
  it('allows no cross-origin caller in staging or production when unset', () => {
    expect(
      loadGatewayEnv({ ...base, APP_ENV: 'production' }).CORS_ALLOWED_ORIGINS,
    ).toEqual([]);
    expect(
      loadGatewayEnv({ ...base, APP_ENV: 'staging', CORS_ALLOWED_ORIGINS: '' })
        .CORS_ALLOWED_ORIGINS,
    ).toEqual([]);
  });

  it('admits the local origins in development so the dev stack self-checks', () => {
    expect(loadGatewayEnv(base).CORS_ALLOWED_ORIGINS).toEqual([
      'http://localhost:8190',
      'http://localhost:4200',
    ]);
  });

  // The hop count decides which x-forwarded-for entry becomes req.ip. Too low and every
  // caller shares nginx's bucket (a self-DoS); a non-number must fail at boot, not silently
  // coerce (U19).
  it('rejects a hop count that is not a positive integer', () => {
    expect(() => loadGatewayEnv({ ...base, TRUST_PROXY_HOPS: '0' })).toThrow();
    expect(() =>
      loadGatewayEnv({ ...base, TRUST_PROXY_HOPS: 'abc' }),
    ).toThrow();
    expect(
      loadGatewayEnv({ ...base, TRUST_PROXY_HOPS: '2' }).TRUST_PROXY_HOPS,
    ).toBe(2);
  });

  it('fails fast on a missing APP_ENV rather than assuming one', () => {
    const { APP_ENV: _omitted, ...withoutAppEnv } = base;
    expect(() => loadGatewayEnv(withoutAppEnv)).toThrow();
  });
});
