import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { identityHasPermission } from '@sanad/contracts';
import { httpError } from '@sanad/i18n';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { PERMISSIONS_METADATA_KEY } from '../decorators/require-permissions.decorator.js';

/**
 * Enforces `@RequirePermissions(...)` against the authenticated identity attached by
 * `JwtAuthGuard` (run it after the auth guard). No declared permissions → allow.
 * Missing identity → 401; insufficient permissions → 403 (the P2 "Done when").
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const identity = request.identity;
    if (!identity) {
      throw httpError(HttpStatus.UNAUTHORIZED, 'auth.noIdentity');
    }

    const allowed = required.every((permission) =>
      identityHasPermission(identity, permission),
    );
    if (!allowed) {
      throw httpError(HttpStatus.FORBIDDEN, 'auth.forbidden');
    }
    return true;
  }
}
