import { HttpStatus } from '@nestjs/common';

/**
 * Maps the Postgres error codes we surface to an HTTP status + **message key** (N9/U24).
 * Keyed by SQLSTATE; the exception filter renders the key into the caller's locale, and
 * anything unmapped falls through to the localized generic 500.
 */
export const POSTGRES_ERROR_MAP: Record<
  string,
  { status: number; messageKey: string }
> = {
  '23505': { status: HttpStatus.CONFLICT, messageKey: 'common.duplicate' },
  '23503': {
    status: HttpStatus.CONFLICT,
    messageKey: 'common.relatedConstraint',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    messageKey: 'common.requiredFieldMissing',
  },
  '23514': {
    status: HttpStatus.BAD_REQUEST,
    messageKey: 'common.checkConstraint',
  },
};
