import { z } from 'zod';

/**
 * The ONE typed environment accessor for the admin portal (U19). Every other module
 * reads `env`, never `import.meta.env` directly (enforced by eslint). Validated once
 * at module load; a malformed/missing required value throws here, failing fast.
 * `APP_ENV` drives all environment branching (OPS1) — never `NODE_ENV`.
 */
const envSchema = z
  .object({
    APP_ENV: z.enum(['development', 'staging', 'production']),
    // Relative default → works behind nginx in every environment with no CORS.
    apiBaseUrl: z.string().min(1).default('/api'),
  })
  .strict();

export type Env = z.infer<typeof envSchema>;

/** Pure parser (testable without `import.meta`); throws on an invalid environment. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid admin-portal environment: ${result.error.issues
        .map((issue) => `${issue.path.join('.')} ${issue.message}`)
        .join('; ')}`,
    );
  }
  return result.data;
}

function readRawEnv(): Record<string, unknown> {
  const meta = import.meta.env;
  return {
    APP_ENV: meta.VITE_APP_ENV ?? (meta.PROD ? 'production' : 'development'),
    apiBaseUrl: meta.VITE_API_BASE_URL,
  };
}

export const env: Env = parseEnv(readRawEnv());
