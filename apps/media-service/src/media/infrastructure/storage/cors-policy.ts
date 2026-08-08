import type { StorageCorsRule, StorageCorsState } from '@sanad/contracts';
import {
  CORS_ALLOWED_HEADERS,
  CORS_ALLOWED_METHODS,
  CORS_EXPOSE_HEADERS,
  CORS_MAX_AGE_SECONDS,
} from './storage.constants.js';

/**
 * The PURE half of the storage-CORS feature — no SDK, no I/O, fully unit-tested (TDD1).
 * The provider adapter only translates these shapes to/from `Get/PutBucketCorsCommand`.
 *
 * Background: the admin SPA PUTs bytes from the BROWSER to the bucket, so the bucket must
 * allow the admin's origin or every upload dies in preflight with a 403 (rules change-log
 * 2026-07-20).
 */

/** The policy we write: exactly our origins, exactly the verbs/headers a presigned PUT needs. */
export function buildCorsPolicy(origins: string[]): StorageCorsRule[] {
  return [
    {
      allowedOrigins: [...origins],
      allowedMethods: [...CORS_ALLOWED_METHODS],
      allowedHeaders: [...CORS_ALLOWED_HEADERS],
      exposeHeaders: [...CORS_EXPOSE_HEADERS],
      maxAgeSeconds: CORS_MAX_AGE_SECONDS,
    },
  ];
}

/**
 * Does `pattern` cover `origin`, using S3/R2 wildcard semantics? `*` matches everything and a
 * single `*` inside a pattern matches one or more characters (`https://*.sanad.tech`). Scheme
 * and host are case-insensitive; the port is part of the origin and must match exactly — the
 * trap that makes `localhost:4200` fail against a `localhost:8190` rule.
 */
function patternCovers(origin: string, pattern: string): boolean {
  if (pattern === '*') return true;
  const target = origin.toLowerCase();
  const candidate = pattern.toLowerCase();
  if (!candidate.includes('*')) return candidate === target;
  const escaped = candidate
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]+');
  return new RegExp(`^${escaped}$`).test(target);
}

/** Is `origin` covered by any of `patterns`? */
export function originAllowedBy(origin: string, patterns: string[]): boolean {
  return patterns.some((pattern) => patternCovers(origin, pattern));
}

/**
 * A rule only unblocks a presigned browser upload if it permits ALL THREE of: the origin, the
 * PUT verb, and the `Content-Type` request header the preflight asks for. A rule matching the
 * origin but missing the header still fails the preflight — so we check the whole triple rather
 * than reporting a green state the browser will disagree with (U23: no lying "ok").
 */
function ruleUnblocksUpload(rule: StorageCorsRule, origin: string): boolean {
  const methods = rule.allowedMethods.map((method) => method.toUpperCase());
  const headers = rule.allowedHeaders.map((header) => header.toLowerCase());
  return (
    originAllowedBy(origin, rule.allowedOrigins) &&
    methods.includes('PUT') &&
    (headers.includes('*') || headers.includes('content-type'))
  );
}

/** What the bucket's current rules mean for us. */
export interface CorsEvaluation {
  state: Extract<StorageCorsState, 'ok' | 'missing' | 'origin-not-allowed'>;
  /** Every origin the bucket mentions — shown so the owner sees what IS configured. */
  allowedOrigins: string[];
}

export function evaluateCorsRules(
  rules: StorageCorsRule[],
  requiredOrigins: string[],
): CorsEvaluation {
  const allowedOrigins = [
    ...new Set(rules.flatMap((rule) => rule.allowedOrigins)),
  ];
  if (rules.length === 0) {
    return { state: 'missing', allowedOrigins };
  }
  const covered = requiredOrigins.every((origin) =>
    rules.some((rule) => ruleUnblocksUpload(rule, origin)),
  );
  return { state: covered ? 'ok' : 'origin-not-allowed', allowedOrigins };
}
