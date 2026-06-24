import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * RMQ-friendly media failures carrying an HTTP `statusCode` so the gateway's
 * `toHttpException` maps them to the right response (MS2). Domain errors thrown in a
 * `@MessagePattern` handler MUST be `RpcException`s — a plain Nest `HttpException`
 * doesn't serialize its status across the broker.
 */
export function mediaNotFound(id: string): RpcException {
  return new RpcException({
    statusCode: HttpStatus.NOT_FOUND,
    message: `Media asset ${id} not found`,
  });
}

export function uploadNotAllowed(message: string): RpcException {
  return new RpcException({
    statusCode: HttpStatus.BAD_REQUEST,
    message,
  });
}

export function storageUnavailable(): RpcException {
  return new RpcException({
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'Media storage is not configured on this deployment',
  });
}
