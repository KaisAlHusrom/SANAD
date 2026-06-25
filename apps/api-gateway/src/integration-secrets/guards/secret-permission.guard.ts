import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  identityHasPermission,
  SECRET_REGISTRY_LIST,
  type IdentityContext,
} from '@sanad/contracts';

/** The request shape this guard reads — the auth identity + the `:key` route param. */
interface SecretRequest {
  identity?: IdentityContext;
  params?: Record<string, string>;
}

/**
 * Per-integration RBAC for the secret vault (N13 — each third party owns its permission).
 * Runs AFTER `JwtAuthGuard`: resolves the `:key` route param to its registry entry and
 * enforces that entry's `managePermission`. An unknown/invalid key is deferred to the
 * route's `ZodValidationPipe` (400) — never silently allowed. Admin's global `manage`
 * wildcard passes through `identityHasPermission`.
 */
@Injectable()
export class SecretPermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SecretRequest>();
    const key = request.params?.['key'];
    const entry = SECRET_REGISTRY_LIST.find(
      (candidate) => candidate.key === key,
    );
    if (!entry) {
      // Unknown key — let the param pipe reject it (400); don't 403 a typo.
      return true;
    }

    const identity = request.identity;
    if (!identity) {
      throw new UnauthorizedException('No authenticated identity');
    }
    if (!identityHasPermission(identity, entry.managePermission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
