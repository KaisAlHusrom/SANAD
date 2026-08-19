import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { AUDITED_METADATA_KEY } from '../../audit.constants.js';
import { AuditInterceptor } from '../interceptors/audit/audit.interceptor.js';

/** What a handler declares about the action it performs. */
export interface AuditedOptions {
  /** Namespaced `<entity>.<verb>`, e.g. `settings.updated`. */
  action: string;
  entityType: string;
}

/**
 * Marks a handler as audited: the interceptor opens an audit scope around it (so the actor and
 * the caller's circumstances are available to everything beneath), and guarantees a row even if
 * the service records nothing itself — a delete with no diff is still an event worth having.
 *
 * Shaped like `@RequirePermissions` (`SetMetadata` + `Reflector.getAllAndOverride`), so there is
 * one convention for "a handler declares something the platform enforces" — but it also **binds
 * its own interceptor**, which the permissions guard does not need to.
 *
 * That is deliberate and load-bearing: a global `APP_INTERCEPTOR` does NOT reach the RMQ side of a
 * hybrid app, because `connectMicroservice` gives the microservice a fresh `ApplicationConfig`
 * unless `inheritAppConfig` is set — and setting it would also apply the HTTP response envelope to
 * every RMQ reply. Binding here makes the declaration self-sufficient on both transports, with
 * nothing for a service's `main.ts` to remember. `audited-rpc.spec.ts` pins it.
 */
export const Audited = (
  options: AuditedOptions,
): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(AUDITED_METADATA_KEY, options),
    UseInterceptors(AuditInterceptor),
  );
