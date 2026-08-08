import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { MessageParams } from '@sanad/contracts';
import type { MessageKey } from '../catalog/ar.catalog.js';

/** The payload both factories put on the wire — a status plus the key, never prose (U24). */
function payload(
  status: number,
  messageKey: MessageKey,
  params?: MessageParams,
): { statusCode: number; messageKey: MessageKey; params?: MessageParams } {
  return params === undefined
    ? { statusCode: status, messageKey }
    : { statusCode: status, messageKey, params };
}

/**
 * A domain failure raised inside an RMQ `@MessagePattern` handler (MS2/U24). It MUST be an
 * `RpcException` — a plain `HttpException` doesn't serialize its status across the broker —
 * and it carries a **message key**, which the gateway's exception filter renders into the
 * caller's locale. Replaces every per-service `RpcException({ …, message: 'English prose' })`.
 */
export function rpcError(
  status: number,
  messageKey: MessageKey,
  params?: MessageParams,
): RpcException {
  return new RpcException(payload(status, messageKey, params));
}

/**
 * The same, for a failure raised **inside the gateway itself** (a guard, a controller-level
 * check) where an `HttpException` is the right currency. The exception filter reads the key
 * off the response and translates it once (U24).
 */
export function httpError(
  status: number,
  messageKey: MessageKey,
  params?: MessageParams,
): HttpException {
  return new HttpException(payload(status, messageKey, params), status);
}
