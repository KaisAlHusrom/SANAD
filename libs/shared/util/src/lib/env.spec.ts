import { describe, expect, it } from 'vitest';
import { EnvError, isProduction, loadEnv, readAppEnv } from './env.js';
import { z } from 'zod';

describe('env accessor', () => {
  it('reads a valid APP_ENV', () => {
    expect(readAppEnv({ APP_ENV: 'staging' })).toBe('staging');
    expect(isProduction(readAppEnv({ APP_ENV: 'production' }))).toBe(true);
  });

  it('fails fast on a missing or invalid APP_ENV', () => {
    expect(() => readAppEnv({})).toThrow(EnvError);
    expect(() => readAppEnv({ APP_ENV: 'prod' })).toThrow(EnvError);
  });

  it('loadEnv validates a full schema and fails fast', () => {
    const schema = z.object({ PORT: z.string().min(1) });
    expect(loadEnv(schema, { PORT: '3000' }).PORT).toBe('3000');
    expect(() => loadEnv(schema, {})).toThrow(EnvError);
  });
});
