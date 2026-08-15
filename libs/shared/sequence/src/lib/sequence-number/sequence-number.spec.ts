import { describe, expect, it } from 'vitest';
import {
  SEQUENCE_FORMAT_DEFAULTS,
  type SequenceFormat,
} from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import { CONTINUOUS_PERIOD } from '../sequence-store.types.js';
import { formatSequenceNumber, periodFor } from './sequence-number.js';

const proposal = SEQUENCE_FORMAT_DEFAULTS.proposal;

describe('periodFor', () => {
  it('uses the calendar year of the clock — never `new Date()` (N3)', () => {
    const clock = DateTimeService.fixed('2026-03-04T10:00:00.000Z');
    expect(periodFor(proposal, clock)).toBe('2026');
  });

  it('returns the single continuous period when the format never resets', () => {
    const clock = DateTimeService.fixed('2026-03-04T10:00:00.000Z');
    expect(periodFor({ ...proposal, reset: 'never' }, clock)).toBe(
      CONTINUOUS_PERIOD,
    );
  });

  it('rolls over at the UTC year boundary, not the local one', () => {
    expect(
      periodFor(proposal, DateTimeService.fixed('2026-12-31T23:59:59.000Z')),
    ).toBe('2026');
    expect(
      periodFor(proposal, DateTimeService.fixed('2027-01-01T00:00:01.000Z')),
    ).toBe('2027');
  });
});

describe('formatSequenceNumber', () => {
  it('prints prefix, period and a zero-padded value', () => {
    expect(formatSequenceNumber(proposal, '2026', 1)).toBe('PRO-2026-0001');
    expect(
      formatSequenceNumber(SEQUENCE_FORMAT_DEFAULTS.contract, '2026', 42),
    ).toBe('CTR-2026-0042');
  });

  it('omits the period segment when the counter never resets', () => {
    expect(
      formatSequenceNumber(
        { ...proposal, reset: 'never' },
        CONTINUOUS_PERIOD,
        7,
      ),
    ).toBe('PRO-0007');
  });

  it('GROWS past the padding rather than truncating — number 10 000 is still valid', () => {
    expect(formatSequenceNumber(proposal, '2026', 10_000)).toBe(
      'PRO-2026-10000',
    );
  });

  it('honours a custom separator and padding', () => {
    const format: SequenceFormat = {
      prefix: 'Q',
      reset: 'yearly',
      padding: 6,
      separator: '/',
    };
    expect(formatSequenceNumber(format, '2026', 12)).toBe('Q/2026/000012');
  });

  it('refuses a value that cannot be a sequence number', () => {
    expect(() => formatSequenceNumber(proposal, '2026', 0)).toThrow();
    expect(() => formatSequenceNumber(proposal, '2026', -1)).toThrow();
    expect(() => formatSequenceNumber(proposal, '2026', 1.5)).toThrow();
  });
});
