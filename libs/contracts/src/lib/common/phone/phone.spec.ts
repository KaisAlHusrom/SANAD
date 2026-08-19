import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_INVALID_MESSAGE_KEY,
  formatPhoneInternational,
  parsePhone,
  phoneSchema,
} from './phone.js';

describe('parsePhone', () => {
  it('normalizes a written international number to E.164', () => {
    expect(parsePhone('+966 50 123 4567')?.e164).toBe('+966501234567');
    expect(parsePhone('+966-50-123-4567')?.e164).toBe('+966501234567');
    expect(parsePhone('  +966501234567  ')?.e164).toBe('+966501234567');
  });

  it('reads `00` as the written-out international prefix', () => {
    expect(parsePhone('00966501234567')?.e164).toBe('+966501234567');
  });

  it('is idempotent — re-parsing its own output changes nothing', () => {
    const once = parsePhone('+971 50 123 4567')?.e164 ?? '';
    expect(parsePhone(once)?.e164).toBe(once);
  });

  it('reports the country and the national part, for a picker to render', () => {
    const parsed = parsePhone('+966501234567');
    expect(parsed?.country).toBe('SA');
    expect(parsed?.callingCode).toBe('966');
    expect(parsed?.nationalNumber).toBe('501234567');
  });

  it('accepts a national number ONLY when a default country is supplied', () => {
    expect(parsePhone('0501234567')).toBeNull();
    expect(parsePhone('0501234567', 'SA')?.e164).toBe('+966501234567');
  });

  it('rejects a number that is wrong for its own country, not just malformed text', () => {
    // Right shape, real calling code, impossible Saudi subscriber number.
    expect(parsePhone('+966123')).toBeNull();
    expect(parsePhone('+9665012345678901')).toBeNull();
  });

  it('rejects empty and garbage input', () => {
    expect(parsePhone('')).toBeNull();
    expect(parsePhone('   ')).toBeNull();
    expect(parsePhone('not a phone')).toBeNull();
    expect(parsePhone('+')).toBeNull();
  });

  it('validates the countries the site actually sells into', () => {
    expect(parsePhone('+971501234567')?.country).toBe('AE');
    expect(parsePhone('+20 100 123 4567')?.country).toBe('EG');
    expect(parsePhone('+1 415 555 2671')?.country).toBe('US');
  });
});

describe('phoneSchema', () => {
  it('parses to the normalized E.164 string', () => {
    expect(phoneSchema.parse('+966 50 123 4567')).toBe('+966501234567');
  });

  it('rejects a bare national number — never silently assume a country server-side', () => {
    expect(phoneSchema.safeParse('0501234567').success).toBe(false);
  });

  it('carries the i18n catalog KEY as its message, never English prose (U24)', () => {
    const result = phoneSchema.safeParse('nope');
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]?.message).toBe(PHONE_INVALID_MESSAGE_KEY);
    expect(PHONE_INVALID_MESSAGE_KEY).toBe('validation.invalidPhone');
  });

  it('rejects a missing value with zod’s own required issue, not the phone key', () => {
    const result = phoneSchema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]?.code).toBe('invalid_type');
  });
});

describe('formatPhoneInternational', () => {
  it('renders a stored E.164 number in readable international form', () => {
    expect(formatPhoneInternational('+966501234567')).toBe('+966 50 123 4567');
  });

  it('falls back to the raw value rather than rendering nothing (U23)', () => {
    expect(formatPhoneInternational('not a phone')).toBe('not a phone');
  });
});

describe('DEFAULT_PHONE_COUNTRY', () => {
  it('is Saudi Arabia — the audience the forms are built for', () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe('SA');
  });
});
