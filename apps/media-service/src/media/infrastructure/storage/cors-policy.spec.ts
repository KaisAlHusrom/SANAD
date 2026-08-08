import { describe, expect, it } from 'vitest';
import {
  buildCorsPolicy,
  evaluateCorsRules,
  originAllowedBy,
} from './cors-policy.js';

describe('buildCorsPolicy (the policy we write to the bucket)', () => {
  it('allows PUT from exactly the required origins, with the headers a presigned PUT sends', () => {
    const [rule] = buildCorsPolicy(['http://localhost:8190']);
    expect(rule).toBeDefined();
    expect(rule?.allowedOrigins).toEqual(['http://localhost:8190']);
    expect(rule?.allowedMethods).toContain('PUT');
    // the presigned PUT sends Content-Type; the browser preflights it
    expect(rule?.allowedHeaders).toContain('content-type');
    // the client may want the object's ETag back
    expect(rule?.exposeHeaders).toContain('etag');
    expect(rule?.maxAgeSeconds).toBeGreaterThan(0);
  });

  it('never writes a wildcard origin (a bucket open to every site)', () => {
    const [rule] = buildCorsPolicy(['https://admin.sanad.tech']);
    expect(rule?.allowedOrigins).not.toContain('*');
  });
});

describe('originAllowedBy (wildcard semantics, as R2/S3 evaluate them)', () => {
  it('matches an exact origin', () => {
    expect(
      originAllowedBy('http://localhost:8190', ['http://localhost:8190']),
    ).toBe(true);
  });

  it('matches a `*` wildcard rule', () => {
    expect(originAllowedBy('http://localhost:8190', ['*'])).toBe(true);
  });

  it('matches an S3-style partial wildcard (`https://*.sanad.tech`)', () => {
    expect(
      originAllowedBy('https://admin.sanad.tech', ['https://*.sanad.tech']),
    ).toBe(true);
    expect(
      originAllowedBy('https://admin.evil.com', ['https://*.sanad.tech']),
    ).toBe(false);
  });

  it('is case-insensitive on scheme/host but does not match a different port', () => {
    expect(
      originAllowedBy('http://LOCALHOST:8190', ['http://localhost:8190']),
    ).toBe(true);
    expect(
      originAllowedBy('http://localhost:4200', ['http://localhost:8190']),
    ).toBe(false);
  });
});

describe('evaluateCorsRules (every state the admin must be able to see, U23)', () => {
  const required = ['http://localhost:8190'];

  it('→ `missing` when the bucket has no rules at all (the reported 403)', () => {
    expect(evaluateCorsRules([], required)).toEqual({
      state: 'missing',
      allowedOrigins: [],
    });
  });

  it('→ `ok` when a PUT-capable rule covers every required origin', () => {
    const rules = buildCorsPolicy(required);
    expect(evaluateCorsRules(rules, required)).toEqual({
      state: 'ok',
      allowedOrigins: required,
    });
  });

  it('→ `origin-not-allowed` when rules exist but not for our origin', () => {
    const rules = buildCorsPolicy(['https://someone-else.example']);
    expect(evaluateCorsRules(rules, required)).toEqual({
      state: 'origin-not-allowed',
      allowedOrigins: ['https://someone-else.example'],
    });
  });

  it('→ `origin-not-allowed` when the origin matches but the rule cannot PUT', () => {
    const readOnly = buildCorsPolicy(required).map((rule) => ({
      ...rule,
      allowedMethods: ['GET'],
    }));
    expect(evaluateCorsRules(readOnly, required).state).toBe(
      'origin-not-allowed',
    );
  });

  it('→ `origin-not-allowed` when the origin+method match but Content-Type is not allowed', () => {
    // The preflight asks for `content-type`; a rule that omits it fails the preflight even
    // though the origin looks allowed — the subtlest version of this bug.
    const noHeaders = buildCorsPolicy(required).map((rule) => ({
      ...rule,
      allowedHeaders: ['x-something-else'],
    }));
    expect(evaluateCorsRules(noHeaders, required).state).toBe(
      'origin-not-allowed',
    );
  });

  it('requires EVERY origin to be covered, not just one', () => {
    const rules = buildCorsPolicy(['http://localhost:8190']);
    expect(
      evaluateCorsRules(rules, [
        'http://localhost:8190',
        'https://admin.sanad.tech',
      ]).state,
    ).toBe('origin-not-allowed');
  });

  it('accepts coverage spread across several rules', () => {
    const rules = [
      ...buildCorsPolicy(['http://localhost:8190']),
      ...buildCorsPolicy(['https://admin.sanad.tech']),
    ];
    const result = evaluateCorsRules(rules, [
      'http://localhost:8190',
      'https://admin.sanad.tech',
    ]);
    expect(result.state).toBe('ok');
    expect(result.allowedOrigins).toEqual([
      'http://localhost:8190',
      'https://admin.sanad.tech',
    ]);
  });
});
