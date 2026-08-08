import { z } from 'zod';

/**
 * The ONE typed environment accessor for the website (U19). Every other module reads
 * `env`, never `process.env` directly (enforced by eslint). Validated once at module
 * load; a malformed/missing required value throws here, failing fast. `APP_ENV` drives
 * all environment branching (OPS1) — never `NODE_ENV`.
 *
 * The website runs its reads in **server components** (WEB2), so the gateway base is an
 * absolute in-cluster URL (`http://nginx/api`) — a relative `/api` has no origin to
 * resolve against in an RSC `fetch`.
 */
const envSchema = z
  .object({
    APP_ENV: z.enum(['development', 'staging', 'production']),
    gatewayBaseUrl: z.string().min(1).default('http://nginx/api'),
  })
  .strict();

export type Env = z.infer<typeof envSchema>;

/** Pure parser (testable without `process`); throws on an invalid environment. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid website environment: ${result.error.issues
        .map((issue) => `${issue.path.join('.')} ${issue.message}`)
        .join('; ')}`,
    );
  }
  return result.data;
}

function readRawEnv(): Record<string, unknown> {
  // The single allowed `process.env` read (eslint-exempt for this file).
  const source = process.env;
  const raw: Record<string, unknown> = {
    // `APP_ENV` drives all branching (OPS1); compose sets it explicitly in every env. When
    // truly unset (a bare `next build` / CI), default to `production` (U19 — a mis-built
    // release still reaches the real backend) so build-time module load never throws.
    APP_ENV: source.APP_ENV ?? 'production',
    gatewayBaseUrl: source.GATEWAY_BASE_URL,
  };
  // Drop undefined so zod `.default()` applies (an explicit `undefined` key would not).
  for (const key of Object.keys(raw)) {
    if (raw[key] === undefined) delete raw[key];
  }
  return raw;
}

export const env: Env = parseEnv(readRawEnv());
