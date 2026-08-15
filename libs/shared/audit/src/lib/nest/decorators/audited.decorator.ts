import { SetMetadata } from '@nestjs/common';
import { AUDITED_METADATA_KEY } from '../../audit.constants.js';

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
 * Shaped exactly like `@RequirePermissions` (`SetMetadata` + `Reflector.getAllAndOverride`), so
 * there is one convention for "a handler declares something the platform enforces".
 */
export const Audited = (
  options: AuditedOptions,
): MethodDecorator & ClassDecorator =>
  SetMetadata(AUDITED_METADATA_KEY, options);
