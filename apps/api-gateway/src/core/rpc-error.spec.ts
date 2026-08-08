import { HttpException, HttpStatus } from '@nestjs/common';
import { rpcError } from '@sanad/i18n';
import { describe, expect, it } from 'vitest';
import { toHttpException } from './rpc-error.js';

describe('toHttpException (MS2 + U24)', () => {
  it('preserves a service’s messageKey + params so the filter can localize it', () => {
    // What actually crosses RMQ is the RpcException's PAYLOAD, not the instance.
    const error = toHttpException(
      rpcError(HttpStatus.NOT_FOUND, 'media.notFound', {
        id: 'm-1',
      }).getError(),
    );
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(404);
    expect(error.getResponse()).toEqual({
      statusCode: 404,
      messageKey: 'media.notFound',
      params: { id: 'm-1' },
    });
  });

  it('keeps a key with no params', () => {
    const error = toHttpException({
      statusCode: 403,
      messageKey: 'auth.forbidden',
    });
    expect(error.getResponse()).toEqual({
      statusCode: 403,
      messageKey: 'auth.forbidden',
    });
  });

  it('passes an HttpException through untouched', () => {
    const original = new HttpException('boom', 418);
    expect(toHttpException(original)).toBe(original);
  });

  it('maps an un-keyed upstream failure to a localizable generic key', () => {
    const error = toHttpException({ statusCode: 400 });
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({
      statusCode: 400,
      messageKey: 'common.requestFailed',
    });
  });

  it('maps a timeout / unknown error to the localized upstream key (500)', () => {
    const error = toHttpException(new Error('Timeout has occurred'));
    expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.getResponse()).toMatchObject({
      messageKey: 'common.upstreamError',
    });
  });

  it('never lets raw upstream prose become the user-facing message (U24)', () => {
    const error = toHttpException({
      statusCode: 409,
      message: 'duplicate key value violates unique constraint',
    });
    expect(JSON.stringify(error.getResponse())).not.toContain(
      'unique constraint',
    );
  });
});
