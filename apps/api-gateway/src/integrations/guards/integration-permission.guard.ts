import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  identityHasPermission,
  integrationCapabilitySchema,
  integrationManagePermission,
  type IdentityContext,
} from '@sanad/contracts';
import { httpError } from '@sanad/i18n';

/** The request shape this guard reads — the auth identity + the `:capability` route param. */
interface IntegrationRequest {
  identity?: IdentityContext;
  params?: Record<string, string>;
}

/**
 * Per-capability RBAC for the integrations surface (N13 — each capability owns its permission,
 * so an operator can be granted exactly the integrations they administer). Runs AFTER
 * `JwtAuthGuard`: resolves the `:capability` route param and enforces
 * `settings.integrations.<capability>.manage`. An unknown capability is deferred to the route's
 * `ZodValidationPipe` (400) — never silently allowed, never a 403 for a typo. Admin's global
 * `manage` wildcard passes through `identityHasPermission`.
 */
@Injectable()
export class IntegrationPermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IntegrationRequest>();
    const parsed = integrationCapabilitySchema.safeParse(
      request.params?.['capability'],
    );
    if (!parsed.success) {
      // Unknown capability — let the param pipe reject it (400).
      return true;
    }

    const identity = request.identity;
    if (!identity) {
      throw httpError(HttpStatus.UNAUTHORIZED, 'auth.noIdentity');
    }
    if (
      !identityHasPermission(identity, integrationManagePermission(parsed.data))
    ) {
      throw httpError(HttpStatus.FORBIDDEN, 'auth.forbidden');
    }
    return true;
  }
}
