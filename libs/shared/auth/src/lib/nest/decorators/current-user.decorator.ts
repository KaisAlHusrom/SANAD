import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { IdentityContext } from '../../identity-context.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

/**
 * Injects the authenticated `IdentityContext` attached by `JwtAuthGuard`. Use only
 * on routes the guard protects; throws 401 if no identity is present.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IdentityContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.identity) {
      throw new UnauthorizedException('No authenticated identity');
    }
    return request.identity;
  },
);
