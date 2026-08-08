import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rpcError } from '@sanad/i18n';

/**
 * RMQ-friendly user-management failures carrying an HTTP `statusCode` + a **message key** the
 * gateway renders in the caller's locale (`toHttpException`, U24). Admin-facing (unlike auth
 * errors), so the messages name the offending value via `params`.
 */
export function userNotFound(id: string): RpcException {
  return rpcError(HttpStatus.NOT_FOUND, 'identity.userNotFound', { id });
}

export function emailConflict(email: string): RpcException {
  return rpcError(HttpStatus.CONFLICT, 'identity.emailConflict', { email });
}

export function roleNotFound(key: string): RpcException {
  return rpcError(HttpStatus.NOT_FOUND, 'identity.roleNotFound', { key });
}
