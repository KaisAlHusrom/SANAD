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
 * Bound per handler by `@Audited()`, NOT registered globally. Neither global form reaches a hybrid
 * app's RMQ handlers: `app.useGlobalInterceptors` binds to the HTTP server only, and
 * `APP_INTERCEPTOR` lands in an `ApplicationConfig` that `connectMicroservice` does not share
 * unless `inheritAppConfig` is passed — which would also apply the HTTP response envelope to every
 * RMQ reply. See `audited-rpc.spec.ts`.
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
            subscription = next.handle().subscribe({
              next: (value) => subscriber.next(value),
              error: (error: unknown) => {
                void this.flush(audited, {
                  outcome: 'failed',
                  failureKey: failureKeyOf(error),
                }).finally(() => {
                  subscriber.error(error);
                  settle();
                });
              },
              complete: () => {
                void this.flush(audited).finally(() => {
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

  /**
   * The RMQ headers, or none. `readMessageHeaders` reaches for `context.getMessage()`, which only
   * an `RmqContext` has — on any other transport it throws, and because the scope is built before
   * the handler is subscribed, that throw would surface to the caller as a failed request. Audit
   * must never be a reason the product refuses to work, so an unreadable context degrades to an
   * anonymous actor instead.
   */
  private rpcHeaders(context: ExecutionContext): Record<string, unknown> {
    const rpcContext = context.switchToRpc().getContext<RmqContext>();
    if (typeof rpcContext?.getMessage !== 'function') {
      return {};
    }
    try {
      return readMessageHeaders(rpcContext);
    } catch (error) {
      this.logger.warn(
        `audit could not read the message headers: ${String(error instanceof Error ? error.message : error)}`,
      );
      return {};
    }
  }

  private async flush(
    audited: AuditedOptions,
    options: { outcome?: 'failed'; failureKey?: string | null } = {},
  ): Promise<void> {
    try {
      // The guarantee row is a FALLBACK, not an addition: the recorder writes it only when the
      // handler recorded nothing of its own (or when the call failed, since anything it wrote
      // inside the transaction rolled back with it). Emitting it unconditionally gave every
      // audited write a phantom twin with a null entityId and no diff.
      await this.recorder.flush(this.db, {
        ...options,
        fallback: { action: audited.action, entityType: audited.entityType },
      });
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
      const headers = this.rpcHeaders(context);
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
