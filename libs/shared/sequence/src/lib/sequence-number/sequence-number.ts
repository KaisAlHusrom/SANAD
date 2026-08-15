import type { SequenceFormat } from '@sanad/contracts';
import type { DateTimeService } from '@sanad/database';
import { CONTINUOUS_PERIOD } from '../sequence-store.types.js';

/**
 * Which counter a number is drawn from. A yearly format keys on the **UTC** year — the DB writes
 * UTC (N3), so a document created at 23:00 in Riyadh on 31 December belongs to the year the
 * database will agree it belongs to, not the one the viewer's timezone suggests.
 */
export function periodFor(
  format: SequenceFormat,
  clock: DateTimeService,
): string {
  return format.reset === 'never'
    ? CONTINUOUS_PERIOD
    : String(clock.now().toUTC().year);
}

/**
 * Print an allocated value: `PRO-2026-0001`. Padding is a MINIMUM — the 10 000th proposal of a
 * year prints as `PRO-2026-10000` rather than being truncated into a collision with an existing
 * number. A non-positive or fractional value throws (an English invariant, U24f): it means the
 * allocator was bypassed, which is a bug, not something to render.
 */
export function formatSequenceNumber(
  format: SequenceFormat,
  period: string,
  value: number,
): string {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`sequence: value must be a positive integer, got ${value}`);
  }
  const padded = String(value).padStart(format.padding, '0');
  const segments =
    period === CONTINUOUS_PERIOD
      ? [format.prefix, padded]
      : [format.prefix, period, padded];
  return segments.join(format.separator);
}
