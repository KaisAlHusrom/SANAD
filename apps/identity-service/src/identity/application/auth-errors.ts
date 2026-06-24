import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * RMQ-friendly auth failures carrying an HTTP `statusCode` so the gateway can map
 * them back to the right response (the gateway's `toHttpException`). Kept vague on
 * purpose — never reveal whether the email or the password was wrong.
 */
export function invalidCredentials(): RpcException {
  return new RpcException({
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Invalid credentials',
  });
}

export function invalidRefreshToken(): RpcException {
  return new RpcException({
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'Invalid or expired refresh token',
  });
}
