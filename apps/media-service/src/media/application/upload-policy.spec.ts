import { describe, expect, it } from 'vitest';
import { RpcException } from '@nestjs/microservices';
import { assertUploadAllowed } from './upload-policy.js';

const ALLOWED = ['image/png', 'application/pdf'] as const;
const MAX = 1000;

describe('assertUploadAllowed', () => {
  it('accepts an allowed type within the size ceiling', () => {
    expect(() =>
      assertUploadAllowed('image/png', 500, MAX, ALLOWED),
    ).not.toThrow();
  });

  it('rejects a disallowed content type with a 400 RpcException', () => {
    try {
      assertUploadAllowed('application/zip', 10, MAX, ALLOWED);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toMatchObject({
        statusCode: 400,
      });
    }
  });

  it('rejects a file larger than the ceiling with a 400 RpcException', () => {
    try {
      assertUploadAllowed('image/png', MAX + 1, MAX, ALLOWED);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      expect((error as RpcException).getError()).toMatchObject({
        statusCode: 400,
      });
    }
  });
});
