import { HttpException, HttpStatus } from '@nestjs/common';
import { isLocalizedMessage } from '@sanad/contracts';
import { httpError } from '@sanad/i18n';

/**
 * Map an error that came back over RMQ into an HttpException so the gateway's exception
 * filter renders the right status (MS2) **and the right language** (U24). Services raise
 * failures as `rpcError(status, messageKey, params)`, whose payload crosses the broker as
 * `{ statusCode, messageKey, params }` — that key is carried through verbatim and rendered
 * once, at the edge.
 *
 * An upstream that sends a bare `message` string is treated as **un-keyed**: its prose is
 * deliberately dropped (it would reach the user untranslated) and replaced by the generic
 * localized key, keeping only the status. Anything else (timeout, unknown) → a localized 500.
 */
export function toHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }
  if (isLocalizedMessage(error)) {
    const { statusCode } = error as { statusCode?: unknown };
    const status =
      typeof statusCode === 'number' ? statusCode : HttpStatus.BAD_REQUEST;
    // Built inline rather than via `httpError()`: this FORWARDS a key that arrived over the
    // wire, so it cannot be checked against the `MessageKey` union the way authored keys are.
    return new HttpException(
      error.params === undefined
        ? { statusCode: status, messageKey: error.messageKey }
        : {
            statusCode: status,
            messageKey: error.messageKey,
            params: error.params,
          },
      status,
    );
  }
  if (typeof error === 'object' && error !== null) {
    const { statusCode } = error as { statusCode?: unknown };
    if (typeof statusCode === 'number') {
      return httpError(statusCode, 'common.requestFailed');
    }
  }
  return httpError(HttpStatus.INTERNAL_SERVER_ERROR, 'common.upstreamError');
}
