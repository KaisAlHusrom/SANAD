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
      expect((error as RpcException).getError()).toEqual({
        statusCode: 400,
        messageKey: 'media.upload.typeNotAllowed',
        params: { contentType: 'application/zip' },
      });
    }
  });

  it('rejects a file larger than the ceiling with a 400 RpcException', () => {
    try {
      assertUploadAllowed('image/png', MAX + 1, MAX, ALLOWED);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      // The ceiling is stated in whole MB — the owner reads MB, not bytes (U24/U23).
      expect((error as RpcException).getError()).toEqual({
        statusCode: 400,
        messageKey: 'media.upload.tooLarge',
        params: { maxMb: 0 },
      });
    }
  });

  it('states a realistic ceiling in whole megabytes', () => {
    try {
      assertUploadAllowed(
        'image/png',
        30 * 1024 * 1024,
        25 * 1024 * 1024,
        ALLOWED,
      );
      expect.fail('should have thrown');
    } catch (error) {
      expect((error as RpcException).getError()).toMatchObject({
        params: { maxMb: 25 },
      });
    }
  });
});
