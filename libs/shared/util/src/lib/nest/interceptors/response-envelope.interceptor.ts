import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { HttpResponseEnvelope } from '@sanad/contracts';
import { map, type Observable } from 'rxjs';
import { toHttpEnvelope } from '../../envelope.js';
import type { TimestampSource } from '../types/timestamp-source.js';

/**
 * Wraps every HTTP response in the single wire envelope (N9), adding `path` +
 * `timestamp` once. Already-wrapped values (from `ok()`) are enriched, not
 * double-wrapped. Construct globally in `main.ts` with the app's `DateTimeService`.
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
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const path = request?.url ?? '';
    const timestamp = this.clock.nowIso();
    return next
      .handle()
      .pipe(map((data) => toHttpEnvelope(data, path, timestamp)));
  }
}
