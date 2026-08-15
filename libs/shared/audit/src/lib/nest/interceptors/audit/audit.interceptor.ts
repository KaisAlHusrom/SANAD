import {
  Inject,
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { identityFromHeaders } from '@sanad/auth';
import { EMPTY_REQUEST_CONTEXT, type IdentityContext } from '@sanad/contracts';
import { DRIZZLE } from '@sanad/database';
import {
  readMessageHeaders,
  requestContextFromHeaders,
} from '@sanad/messaging';
import { Observable } from 'rxjs';
import type { RmqContext } from '@nestjs/microservices';
import { AUDITED_METADATA_KEY } from '../../../audit.constants.js';
import type {
  AuditActor,
  AuditDb,
  AuditScope,
} from '../../../audit-entry.types.js';
import { AuditRecorder } from '../../audit-recorder/audit-recorder.js';
import type { AuditedOptions } from '../../decorators/audited.decorator.js';

/** The subset of an Express request the HTTP path reads. */
interface AuditableHttpRequest {
  identity?: IdentityContext;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

function actorFrom(identity: IdentityContext | null): AuditActor {
  if (!identity) {
    return { userId: null, role: null, type: 'anonymous' };
  }
  return {
    userId: identity.userId,
    // The primary role is enough for the trail; the full set is in the identity service.
    role: identity.roles[0] ?? null,
    type: 'user',
  };
}

/** A thrown localized error carries its key (U24); anything else has none. */
function failureKeyOf(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const candidate =
    (error as { messageKey?: unknown }).messageKey ??
    ((error as { error?: { messageKey?: unknown } }).error ?? {}).messageKey;
  return typeof candidate === 'string' ? candidate : null;
}

/**
 * Turns `@Audited()` into a row (P8.8).
 *
 * Registered through `APP_INTERCEPTOR` by `AuditModule` — the ONE registration form that reaches
 * both the HTTP and the RMQ context of a hybrid app. `app.useGlobalInterceptors` binds to the
 * HTTP server only, which is why every service's `main.ts` already notes that the envelope
 * interceptor is not inherited by its microservice.
 *
 * Two rules it will not break:
 * - **The scope wraps the SUBSCRIPTION, not the call to `intercept`.** `next.handle()` only
 *   builds an observable; the handler runs when it is subscribed, after every interceptor has
 *   returned. Opening the `AsyncLocalStorage` scope around `next.handle()` alone would leave the
 *   handler outside it and every actor silently null — the failure a spec here pins.
 * - **A failed audit write never fails the request.** The trail exists to record what the product
 *   did; it must not become a new way for the product to refuse to do it.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly recorder: AuditRecorder,
    @Inject(DRIZZLE) private readonly db: AuditDb,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const audited = this.reflector.getAllAndOverride<
      AuditedOptions | undefined
    >(AUDITED_METADATA_KEY, [context.getHandler(), context.getClass()]);
    if (!audited) {
      return next.handle();
    }
    const scope = this.scopeFor(context);

    return new Observable((subscriber) => {
      let subscription: { unsubscribe(): void } | undefined;
      void this.recorder.runInScope(
        scope,
        () =>
          new Promise<void>((settle) => {
            // The handler must produce at least this row even if it records nothing itself.
            this.recorder.record({
              action: audited.action,
              entityType: audited.entityType,
            });
            subscription = next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (error: unknown) => {
                void this.flush({
                  outcome: 'failed',
                  failureKey: failureKeyOf(error),
                }).finally(() => {
                  subscriber.error(error);
                  settle();
                });
              },
              complete: () => {
                void this.flush().finally(() => {
                  subscriber.complete();
                  settle();
                });
              },
            });
          }),
      );
      return () => subscription?.unsubscribe();
    });
  }

  private async flush(
    options: { outcome?: 'failed'; failureKey?: string | null } = {},
  ): Promise<void> {
    try {
      await this.recorder.flush(this.db, options);
    } catch (error) {
      // Surfaced, never swallowed (U23b) — but not turned into a client-facing failure.
      this.logger.error(
        `audit write failed: ${String(error instanceof Error ? error.message : error)}`,
      );
    }
  }

  /** Where the actor comes from depends on how the call arrived. */
  private scopeFor(context: ExecutionContext): AuditScope {
    if (context.getType() === 'rpc') {
      const headers = readMessageHeaders(
        context.switchToRpc().getContext<RmqContext>(),
      );
      return {
        actor: actorFrom(identityFromHeaders(headers)),
        context: requestContextFromHeaders(headers),
      };
    }
    const request = context.switchToHttp().getRequest<AuditableHttpRequest>();
    const userAgent = request?.headers?.['user-agent'];
    return {
      actor: actorFrom(request?.identity ?? null),
      context: {
        ...EMPTY_REQUEST_CONTEXT,
        ip: request?.ip ?? null,
        userAgent: Array.isArray(userAgent)
          ? (userAgent[0] ?? null)
          : (userAgent ?? null),
      },
    };
  }
}
