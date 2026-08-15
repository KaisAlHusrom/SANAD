import {
  SEQUENCE_FORMAT_DEFAULTS,
  sequenceFormatSchema,
  type SequenceFormat,
  type SequenceKind,
} from '@sanad/contracts';
import type { DateTimeService } from '@sanad/database';
import type { AllocatedNumber } from '../allocated-number.types.js';
import {
  formatSequenceNumber,
  periodFor,
} from '../sequence-number/sequence-number.js';
import type { SequenceDb, SequenceStore } from '../sequence-store.types.js';

/**
 * The one call a service makes to number something: bump the counter and print the number.
 *
 * **Allocate LATE inside the business transaction.** The counter row stays locked from the
 * upsert until the caller commits, so every other allocation of the same kind waits behind it —
 * doing it first and then running the rest of the write serialises the whole path.
 */
export class SequenceAllocator {
  constructor(
    private readonly store: SequenceStore,
    private readonly clock: DateTimeService,
  ) {}

  async next(
    exec: SequenceDb,
    kind: SequenceKind,
    override?: SequenceFormat,
  ): Promise<AllocatedNumber> {
    // An override arrives from settings (P8.9), i.e. from outside — validate it here rather
    // than trusting it, or a bad admin entry prints a malformed number onto a signed document.
    const format = override
      ? sequenceFormatSchema.parse(override)
      : SEQUENCE_FORMAT_DEFAULTS[kind];
    const period = periodFor(format, this.clock);
    const value = await this.store.allocate(exec, kind, period);
    return {
      number: formatSequenceNumber(format, period, value),
      value,
      period,
    };
  }
}
