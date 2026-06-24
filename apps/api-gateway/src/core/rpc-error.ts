import { HttpException, InternalServerErrorException } from '@nestjs/common';

/**
 * Map an error that came back over RMQ into an HttpException so the gateway's
 * exception filter renders the right status (MS2). Identity raises auth failures as
 * `RpcException({ statusCode, message })`; anything else (timeout, unknown) → 500.
 */
export function toHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { statusCode?: unknown; message?: unknown };
    if (typeof candidate.statusCode === 'number') {
      const message =
        typeof candidate.message === 'string'
          ? candidate.message
          : 'Request failed';
      return new HttpException(message, candidate.statusCode);
    }
  }
  return new InternalServerErrorException('Upstream service error');
}
