import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { identityHasPermission } from '../../rbac.js';
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
      throw new UnauthorizedException('No authenticated identity');
    }

    const allowed = required.every((permission) =>
      identityHasPermission(identity, permission),
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
