import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { DateTimeService } from './date-time.js';

describe('DateTimeService', () => {
  it('returns a deterministic instant when pinned', () => {
    const svc = DateTimeService.fixed('2026-06-21T00:00:00.000Z');
    expect(svc.nowIso()).toBe('2026-06-21T00:00:00.000Z');
    expect(svc.nowMillis()).toBe(
      DateTime.fromISO('2026-06-21T00:00:00.000Z', { zone: 'utc' }).toMillis(),
    );
  });

  it('adds days immutably', () => {
    const svc = DateTimeService.fixed('2026-06-21T00:00:00.000Z');
    const later = svc.addDays(svc.now(), 5);
    expect(later.toUTC().toISODate()).toBe('2026-06-26');
    expect(svc.now().toUTC().toISODate()).toBe('2026-06-21');
  });
});
