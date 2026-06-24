import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';

/** Default request/reply timeout — RMQ request/reply has none built in (MS2). */
export const DEFAULT_REQUEST_TIMEOUT_MS = 5000;

/** Options for a request/reply send. */
export interface SendRequestOptions {
  /** Per-request timeout; defaults to {@link DEFAULT_REQUEST_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** AMQP message headers — the gateway forwards the validated identity here (MS4). */
  headers?: Record<string, string>;
}

/**
 * Cross-service read over RMQ request/reply (MS2). Always applies `timeout()` +
 * `catchError` so a caller can never forget them, and forwards optional headers
 * (identity, MS4) via an `RmqRecordBuilder`. Resolves the cold observable once.
 */
export async function sendRequest<TResult>(
  client: ClientProxy,
  pattern: string,
  payload: unknown,
  options: SendRequestOptions = {},
): Promise<TResult> {
  const record = new RmqRecordBuilder(payload)
    .setOptions({ headers: options.headers ?? {} })
    .build();

  return firstValueFrom(
    client.send<TResult>(pattern, record).pipe(
      timeout(options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS),
      catchError((error: unknown) => throwError(() => error)),
    ),
  );
}
