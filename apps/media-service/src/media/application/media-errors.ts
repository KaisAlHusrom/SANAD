import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { rpcError } from '@sanad/i18n';

/**
 * RMQ-friendly media failures carrying an HTTP `statusCode` + a **message key** so the
 * gateway's `toHttpException` maps the status and the edge renders the text in the caller's
 * locale (MS2, U24). Domain errors thrown in a `@MessagePattern` handler MUST be
 * `RpcException`s — a plain Nest `HttpException` doesn't serialize its status across the broker.
 */
export function mediaNotFound(id: string): RpcException {
  return rpcError(HttpStatus.NOT_FOUND, 'media.notFound', { id });
}

/** The upload policy rejected the file's TYPE (N7 allowlist). */
export function uploadTypeNotAllowed(contentType: string): RpcException {
  return rpcError(HttpStatus.BAD_REQUEST, 'media.upload.typeNotAllowed', {
    contentType,
  });
}

/** The upload policy rejected the file's SIZE — the ceiling is shown in whole MB. */
export function uploadTooLarge(maxBytes: number): RpcException {
  return rpcError(HttpStatus.BAD_REQUEST, 'media.upload.tooLarge', {
    maxMb: Math.floor(maxBytes / 1024 / 1024),
  });
}

/** The folder id in a path/payload doesn't exist (or was deleted in another tab). */
export function folderNotFound(id: string): RpcException {
  return rpcError(HttpStatus.NOT_FOUND, 'media.folder.notFound', { id });
}

/**
 * A sibling folder already owns this name. A 409, not a 500 from the unique index — "that name
 * is taken" is a normal outcome the user corrects, and it is what SHOULD have happened when the
 * owner's picker silently swallowed repeated creates and filled the table with 14 "Brand" rows.
 */
export function folderNameTaken(name: string): RpcException {
  return rpcError(HttpStatus.CONFLICT, 'media.folder.duplicateName', { name });
}

/** Moving a folder into itself or a descendant would detach the subtree from every root. */
export function folderCycle(): RpcException {
  return rpcError(HttpStatus.BAD_REQUEST, 'media.folder.cycle');
}

/** Deleting a non-empty folder is refused by default, and says exactly what is inside. */
export function folderNotEmpty(
  name: string,
  assets: number,
  folders: number,
): RpcException {
  return rpcError(HttpStatus.CONFLICT, 'media.folder.notEmpty', {
    name,
    assets,
    folders,
  });
}

export function storageUnavailable(): RpcException {
  return rpcError(HttpStatus.SERVICE_UNAVAILABLE, 'media.storageUnavailable');
}
