import { describe, expect, it } from 'vitest';
import { formatDateTime } from './datetime';

const iso = '2026-06-25T09:30:00.000Z';

describe('formatDateTime (F8)', () => {
  it('formats an ISO timestamp for both locales', () => {
    expect(formatDateTime(iso, 'en')).toMatch(/2026/);
    expect(formatDateTime(iso, 'ar')).toMatch(/2026/);
  });

  it('uses Western numerals even for Arabic (locked design decision, U8)', () => {
    // arabic-indic digits (٠١٢…) must NOT appear — latn is forced
    expect(formatDateTime(iso, 'ar')).not.toMatch(/[٠-٩]/);
    expect(formatDateTime(iso, 'ar')).toMatch(/[0-9]/);
  });

  it('returns the raw input for an unparseable date', () => {
    expect(formatDateTime('not-a-date', 'en')).toBe('not-a-date');
  });
});
