import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { describe, expect, it } from 'vitest';
import { httpError, rpcError } from './localized-errors.js';

describe('localized error factories (U24)', () => {
  describe('rpcError', () => {
    it('carries statusCode + messageKey + params across the broker (MS2)', () => {
      const error = rpcError(HttpStatus.NOT_FOUND, 'media.notFound', {
        id: 'abc',
      });
      expect(error).toBeInstanceOf(RpcException);
      expect(error.getError()).toEqual({
        statusCode: 404,
        messageKey: 'media.notFound',
        params: { id: 'abc' },
      });
    });

    it('omits params when there are none — never `params: undefined` on the wire', () => {
      expect(
        rpcError(HttpStatus.CONFLICT, 'common.duplicate').getError(),
      ).toEqual({
        statusCode: 409,
        messageKey: 'common.duplicate',
      });
    });

    it('emits NO prose — the payload has no `message` for a client to render raw', () => {
      const payload = rpcError(
        HttpStatus.BAD_REQUEST,
        'media.invalidIds',
      ).getError();
      expect(payload).not.toHaveProperty('message');
    });
  });

  describe('httpError', () => {
    it('builds an HttpException whose response holds the key', () => {
      const error = httpError(HttpStatus.FORBIDDEN, 'auth.forbidden');
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(403);
      expect(error.getResponse()).toEqual({
        statusCode: 403,
        messageKey: 'auth.forbidden',
      });
    });

    it('keeps params for interpolation at the edge', () => {
      expect(
        httpError(HttpStatus.BAD_REQUEST, 'settings.unknownField', {
          field: 'bucket',
          provider: 'r2',
        }).getResponse(),
      ).toEqual({
        statusCode: 400,
        messageKey: 'settings.unknownField',
        params: { field: 'bucket', provider: 'r2' },
      });
    });
  });
});
