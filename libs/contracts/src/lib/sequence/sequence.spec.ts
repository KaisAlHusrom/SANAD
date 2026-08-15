import { describe, expect, it } from 'vitest';
import {
  SEQUENCE_FORMAT_DEFAULTS,
  SEQUENCE_KINDS,
  sequenceFormatSchema,
  sequenceKindSchema,
} from './sequence-format.zod.types.js';

describe('sequence contracts', () => {
  it('names the numbered entities the commercial phases create', () => {
    expect(sequenceKindSchema.safeParse('proposal').success).toBe(true);
    expect(sequenceKindSchema.safeParse('bogus').success).toBe(false);
  });

  it('ships a coded default format for EVERY kind (U9 — nothing renders unnumbered)', () => {
    for (const kind of SEQUENCE_KINDS) {
      const format = SEQUENCE_FORMAT_DEFAULTS[kind];
      expect(sequenceFormatSchema.safeParse(format).success).toBe(true);
      expect(format.prefix.length).toBeGreaterThan(0);
    }
  });

  it('validates a format and rejects unknown keys (strict, N7)', () => {
    const format = {
      prefix: 'PRO',
      reset: 'yearly',
      padding: 4,
      separator: '-',
    };
    expect(sequenceFormatSchema.safeParse(format).success).toBe(true);
    expect(
      sequenceFormatSchema.safeParse({ ...format, colour: 'red' }).success,
    ).toBe(false);
  });

  it('bounds the padding — a settings typo must not produce a 10 000-digit number', () => {
    const format = { prefix: 'PRO', reset: 'yearly', separator: '-' };
    expect(
      sequenceFormatSchema.safeParse({ ...format, padding: 0 }).success,
    ).toBe(false);
    expect(
      sequenceFormatSchema.safeParse({ ...format, padding: 99 }).success,
    ).toBe(false);
    expect(
      sequenceFormatSchema.safeParse({ ...format, padding: 4.5 }).success,
    ).toBe(false);
  });

  it('rejects a prefix that would make an unreadable number', () => {
    const format = { reset: 'yearly', padding: 4, separator: '-' };
    expect(
      sequenceFormatSchema.safeParse({ ...format, prefix: '' }).success,
    ).toBe(false);
    expect(
      sequenceFormatSchema.safeParse({ ...format, prefix: 'pro 1' }).success,
    ).toBe(false);
  });
});
