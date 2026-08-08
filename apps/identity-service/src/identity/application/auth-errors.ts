import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rpcError } from '@sanad/i18n';

/**
 * RMQ-friendly auth failures carrying an HTTP `statusCode` + a **message key** so the gateway
 * maps the status and renders the text in the caller's locale (`toHttpException`, U24). Kept
 * vague on purpose — never reveal whether the email or the password was wrong.
 */
export function invalidCredentials(): RpcException {
  return rpcError(HttpStatus.UNAUTHORIZED, 'auth.invalidCredentials');
}

export function invalidRefreshToken(): RpcException {
  return rpcError(HttpStatus.UNAUTHORIZED, 'auth.invalidRefreshToken');
}
