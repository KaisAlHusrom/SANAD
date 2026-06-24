import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * RMQ-friendly content failures carrying an HTTP `statusCode` so the gateway's
 * `toHttpException` maps them to the right response (MS2). Domain errors thrown in a
 * `@MessagePattern` handler MUST be `RpcException`s — a plain Nest `HttpException` doesn't
 * serialize its status across the broker.
 */
export function contentNotFound(
  entity: string,
  idOrSlug: string,
): RpcException {
  return new RpcException({
    statusCode: HttpStatus.NOT_FOUND,
    message: `${entity} '${idOrSlug}' not found`,
  });
}

export function slugConflict(slug: string): RpcException {
  return new RpcException({
    statusCode: HttpStatus.CONFLICT,
    message: `The slug '${slug}' is already in use`,
  });
}
