import { z } from 'zod';

/**
 * The deployment environment. Selected by `APP_ENV` — NEVER `NODE_ENV` (which is
 * always `production` once deployed). All environment branching uses this (U19, OPS1).
 */
export const appEnvSchema = z.enum(['development', 'staging', 'production']);

export type AppEnv = z.infer<typeof appEnvSchema>;

/** Thrown when required environment configuration is missing or invalid (fails fast, U19). */
export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

/** Read and validate `APP_ENV` from a provided source (the app passes its env in one place). */
export function readAppEnv(source: Record<string, string | undefined>): AppEnv {
  const parsed = appEnvSchema.safeParse(source['APP_ENV']);
  if (!parsed.success) {
    throw new EnvError(
      `Invalid or missing APP_ENV (expected development | staging | production), got: ${String(
        source['APP_ENV'],
      )}`,
    );
  }
  return parsed.data;
}

/**
 * Validate a full env object against a schema, failing fast with a readable error.
 * The single per-app `env.ts` accessor builds on this (U19).
 */
export function loadEnv<TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
  source: Record<string, string | undefined>,
): z.infer<z.ZodObject<TShape>> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const keys = Object.keys(parsed.error.flatten().fieldErrors).join(', ');
    throw new EnvError(`Invalid environment configuration. Check: ${keys}`);
  }
  return parsed.data;
}

export const isProduction = (env: AppEnv): boolean => env === 'production';
export const isStaging = (env: AppEnv): boolean => env === 'staging';
export const isDevelopment = (env: AppEnv): boolean => env === 'development';
