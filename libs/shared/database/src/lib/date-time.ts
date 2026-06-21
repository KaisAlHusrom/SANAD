import { DateTime } from 'luxon';

/** A clock returns "now" as a Luxon DateTime. Injectable so tests are deterministic. */
export type Clock = () => DateTime;

/**
 * The shared, timezone-aware time source. Code MUST use this instead of
 * `new Date()` / `Date.now()` (N3). DB writes are UTC; reads transform to the
 * configured timezone.
 */
export class DateTimeService {
  constructor(private readonly clock: Clock = () => DateTime.utc()) {}

  /** Current instant as a Luxon DateTime (UTC by default). */
  now(): DateTime {
    return this.clock();
  }

  /** Current instant as an ISO-8601 string. */
  nowIso(): string {
    return this.clock().toUTC().toISO() ?? '';
  }

  /** Current instant in epoch milliseconds. */
  nowMillis(): number {
    return this.clock().toMillis();
  }

  /** Add days to an instant (immutably). */
  addDays(from: DateTime, days: number): DateTime {
    return from.plus({ days });
  }

  /** A service pinned to a fixed instant — for tests. */
  static fixed(iso: string): DateTimeService {
    return new DateTimeService(() => DateTime.fromISO(iso, { zone: 'utc' }));
  }
}
