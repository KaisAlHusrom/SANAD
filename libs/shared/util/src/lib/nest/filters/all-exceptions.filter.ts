import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { failHttp } from '../../envelope.js';
import type { TimestampSource } from '../types/timestamp-source.js';
import { POSTGRES_ERROR_MAP } from './postgres-error-map.constants.js';

/** A response object able to send a JSON body with a status (Express-compatible). */
interface JsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

function extractHttpMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
  }
  return exception.message;
}

function resolveError(exception: unknown): { status: number; message: string } {
  if (exception instanceof HttpException) {
    return {
      status: exception.getStatus(),
      message: extractHttpMessage(exception),
    };
  }
  if (
    typeof exception === 'object' &&
    exception !== null &&
    typeof (exception as { code?: unknown }).code === 'string'
  ) {
    const mapped = POSTGRES_ERROR_MAP[(exception as { code: string }).code];
    if (mapped) {
      return mapped;
    }
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  };
}

/**
 * The single error boundary: every uncaught exception becomes the standard error
 * envelope (N9), with HttpExceptions and known Postgres codes mapped to a status.
 * Construct globally in `main.ts` with the app's `DateTimeService`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly clock: TimestampSource) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<JsonResponse>();
    const request = ctx.getRequest<{ url?: string }>();
    const { status, message } = resolveError(exception);
    response
      .status(status)
      .json(failHttp(message, request?.url ?? '', this.clock.nowIso()));
  }
}
