import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { identityContextSchema } from '@sanad/contracts';
import { httpError } from '@sanad/i18n';
import type { AccessTokenPayload } from '../../jwt-payload.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { TokenVerifier } from '../verifiers/token-verifier.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * Validates the `Authorization: Bearer <jwt>` access token once at the edge (MS4)
 * and attaches the resolved `IdentityContext` to the request for `@CurrentUser()`
 * and the `PermissionsGuard`. Depends only on the `TokenVerifier` seam.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TokenVerifier) private readonly verifier: TokenVerifier,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers['authorization'];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value || !value.startsWith(BEARER_PREFIX)) {
      throw httpError(HttpStatus.UNAUTHORIZED, 'auth.missingToken');
    }

    const token = value.slice(BEARER_PREFIX.length).trim();
    let payload: AccessTokenPayload;
    try {
      payload = this.verifier.verifyAccessToken(token);
    } catch {
      throw httpError(HttpStatus.UNAUTHORIZED, 'auth.invalidToken');
    }

    request.identity = identityContextSchema.parse({
      userId: payload.sub,
      roles: payload.roles,
      permissions: payload.permissions,
      email: payload.email,
    });
    return true;
  }
}
