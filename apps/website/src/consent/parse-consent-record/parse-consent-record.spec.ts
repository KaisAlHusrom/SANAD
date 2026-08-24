import { describe, expect, it } from 'vitest';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import { parseConsentRecord } from './parse-consent-record';

const valid: ConsentRecord = {
  v: 1,
  policyVersion: 1,
  decidedAt: 1_700_000_000_000,
  analytics: true,
  marketing: false,
};

describe('parseConsentRecord', () => {
  it('reads a record this version wrote', () => {
    expect(parseConsentRecord(JSON.stringify(valid))).toEqual(valid);
  });

  it('treats an absent value as never-decided', () => {
    expect(parseConsentRecord(null)).toBeNull();
    expect(parseConsentRecord('')).toBeNull();
  });

  it('re-asks rather than guessing when the stored text is not JSON', () => {
    expect(parseConsentRecord('not json at all')).toBeNull();
    expect(parseConsentRecord('{"v":1,')).toBeNull();
  });

  it('rejects a record written by a shape this build does not understand', () => {
    expect(parseConsentRecord(JSON.stringify({ ...valid, v: 2 }))).toBeNull();
  });

  it('rejects an unknown field rather than honouring half of it', () => {
    expect(
      parseConsentRecord(JSON.stringify({ ...valid, preferences: true })),
    ).toBeNull();
  });

  it.each([
    [
      'a missing category',
      { v: 1, policyVersion: 1, decidedAt: 1, analytics: true },
    ],
    ['a category that is not a boolean', { ...valid, marketing: 'yes' }],
    ['a non-numeric policyVersion', { ...valid, policyVersion: '1' }],
    [
      'a zero policyVersion — 0 means never asked',
      { ...valid, policyVersion: 0 },
    ],
    ['a fractional timestamp', { ...valid, decidedAt: 1.5 }],
    ['a JSON scalar', 42],
    ['a JSON array', [valid]],
    ['a JSON null', null],
  ])('rejects %s', (_label, value) => {
    expect(parseConsentRecord(JSON.stringify(value))).toBeNull();
  });
});
