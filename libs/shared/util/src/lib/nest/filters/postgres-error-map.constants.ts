import { HttpStatus } from '@nestjs/common';

/**
 * Maps the Postgres error codes we surface to an HTTP status + safe message (N9).
 * Keyed by SQLSTATE; anything unmapped falls through to a generic 500.
 */
export const POSTGRES_ERROR_MAP: Record<
  string,
  { status: number; message: string }
> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'Resource already exists' },
  '23503': {
    status: HttpStatus.CONFLICT,
    message: 'Related resource constraint failed',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    message: 'A required field is missing',
  },
  '23514': {
    status: HttpStatus.BAD_REQUEST,
    message: 'A field failed a validation constraint',
  },
};
