import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { isLocalizedMessage, type MessageParams } from '@sanad/contracts';
import { hasMessage, resolveRequestLocale, translate } from '@sanad/i18n';
import { failHttp } from '../../envelope.js';
import type { TimestampSource } from '../types/timestamp-source.js';
import { POSTGRES_ERROR_MAP } from './postgres-error-map.constants.js';

/** A response object able to send a JSON body with a status (Express-compatible). */
interface JsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

/** What the filter renders: a message key (U24) plus the params to interpolate. */
interface ResolvedError {
  status: number;
  messageKey: string;
  params?: MessageParams;
  /** Field path → message KEY, from the validation pipe; rendered like the message itself. */
  errors?: Record<string, string>;
}

/** Read the validation pipe's field→key map off an exception response, if it carries one. */
function fieldErrorsOf(response: unknown): Record<string, string> | undefined {
  if (typeof response !== 'object' || response === null) return undefined;
  const { errors } = response as { errors?: unknown };
  if (typeof errors !== 'object' || errors === null) return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * A status-derived key for an exception that carries no key of its own — Nest's own
 * `Cannot GET /api/x`, body-parser's `request entity too large`, any third-party throw. Their
 * prose is English and untranslatable, so it is DISCARDED rather than rendered verbatim: that
 * fallback was the last channel through which English could reach an Arabic caller (U24).
 */
function keyForStatus(status: number): string {
  if (status === HttpStatus.NOT_FOUND) return 'common.notFound';
  return status >= HttpStatus.INTERNAL_SERVER_ERROR
    ? 'common.internalError'
    : 'common.requestFailed';
}

/** Keep a string only if the catalog can render it; otherwise fall back to the status key. */
function keyOrStatus(candidate: string, status: number): string {
  return hasMessage(candidate) ? candidate : keyForStatus(status);
}

function extractHttpError(exception: HttpException): ResolvedError {
  const status = exception.getStatus();
  const response = exception.getResponse();
  const errors = fieldErrorsOf(response);
  // The U24 shape: `{ statusCode, messageKey, params }` from `httpError()` / a service's
  // `rpcError()` mapped by the gateway.
  if (isLocalizedMessage(response)) {
    return {
      status,
      messageKey: response.messageKey,
      params: response.params,
      errors,
    };
  }
  if (typeof response === 'string') {
    return { status, messageKey: keyOrStatus(response, status), errors };
  }
  if (typeof response === 'object' && response !== null) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') {
      return { status, messageKey: keyOrStatus(message, status), errors };
    }
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return { status, messageKey: keyOrStatus(message[0], status), errors };
    }
  }
  return { status, messageKey: keyOrStatus(exception.message, status), errors };
}

function resolveError(exception: unknown): ResolvedError {
  if (exception instanceof HttpException) {
    return extractHttpError(exception);
  }
  // A repository `findOrFail()` miss is a 404, not a 500 — its own message names the table and
  // id (developer text), so the client gets the localized generic key instead (U24f).
  if (exception instanceof Error && exception.name === 'RecordNotFoundError') {
    return { status: HttpStatus.NOT_FOUND, messageKey: 'common.notFound' };
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
  // An internal invariant throw (`insert returned no row`) never reaches the client —
  // it degrades to the localized generic 500 (U24f).
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    messageKey: 'common.internalError',
  };
}

/**
 * The single error boundary: every uncaught exception becomes the standard error envelope
 * (N9) with its message **rendered into the caller's locale** (U24) — this and the response
 * interceptor are the only places backend text is produced. HttpExceptions and known Postgres
 * codes map to a status. Construct globally in `main.ts` with the app's `DateTimeService`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly clock: TimestampSource) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<JsonResponse>();
    const request = ctx.getRequest<{
      url?: string;
      headers?: Record<string, unknown>;
    }>();
    const locale = resolveRequestLocale(request?.headers);
    const { status, messageKey, params, errors } = resolveError(exception);
    // Field errors are keys too — rendered here, in the same pass as the message, so a form
    // can show a real reason per field instead of one generic sentence (U24/U23).
    // Field values are gated by `hasMessage` for the same reason the message is: a hand-built
    // `BadRequestException({ errors })` must not be able to smuggle prose past the renderer.
    const rendered = errors
      ? Object.fromEntries(
          Object.entries(errors).map(([field, key]) => [
            field,
            translate(hasMessage(key) ? key : 'validation.invalidType', locale),
          ]),
        )
      : undefined;
    response
      .status(status)
      .json(
        failHttp(
          translate(messageKey, locale, params),
          request?.url ?? '',
          this.clock.nowIso(),
          rendered,
        ),
      );
  }
}
