import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { resolveRequestLocale, translate } from '@sanad/i18n';
import { map, type Observable } from 'rxjs';
import { toHttpEnvelope } from '../../envelope.js';
import type { TimestampSource } from '../types/timestamp-source.js';

/**
 * Wraps every HTTP response in the single wire envelope (N9), adding `path` +
 * `timestamp` once. Already-wrapped values (from `ok()`) are enriched, not
 * double-wrapped. The envelope's `message` travels as a **key** and is rendered here into
 * the caller's locale (U24) — this and the exception filter are the only places backend
 * text is produced. Construct globally in `main.ts` with the app's `DateTimeService`.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<
  unknown,
  HttpResponseEnvelope<unknown>
> {
  constructor(private readonly clock: TimestampSource) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<HttpResponseEnvelope<unknown>> {
    const request = context.switchToHttp().getRequest<{
      url?: string;
      headers?: Record<string, unknown>;
    }>();
    const path = request?.url ?? '';
    const locale = resolveRequestLocale(request?.headers);
    const timestamp = this.clock.nowIso();
    return next.handle().pipe(
      map((data) => {
        const envelope = toHttpEnvelope(data, path, timestamp);
        return { ...envelope, message: translate(envelope.message, locale) };
      }),
    );
  }
}
