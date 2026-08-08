import { describe, expect, it } from 'vitest';
import {
  classifyUploadError,
  formatUploadFailure,
} from './classify-upload-error';
import { UploadTransportError } from './put-to-r2';

/**
 * The classifier is the guarantee behind U23a: an upload failure NAMES its cause. Each case here
 * exists because it implies a different user action — configure CORS, reconnect, ask an admin,
 * pick a smaller file. If two cases collapsed into one message, this suite would say so.
 */
describe('classifyUploadError', () => {
  it('a browser-blocked request → the CORS cause, with no pointless retry', () => {
    const failure = classifyUploadError(
      new UploadTransportError('cors', 0, null, 'Failed to fetch'),
    );
    expect(failure.key).toBe('errors.cors');
    expect(failure.retryable).toBe(false);
  });

  it('an offline request → offline, and retrying IS worth offering', () => {
    const failure = classifyUploadError(new UploadTransportError('network', 0));
    expect(failure.key).toBe('errors.offline');
    expect(failure.retryable).toBe(true);
  });

  it("storage's own 403 blames the BUCKET, not the user's permissions, and carries its code", () => {
    const failure = classifyUploadError(
      new UploadTransportError('http', 403, 'AccessDenied', 'Access Denied'),
    );
    expect(failure.key).toBe('errors.uploadRejected');
    expect(failure.detail).toBe('AccessDenied');
  });

  it('a gateway 403 (our RBAC) is a DIFFERENT message from storage refusing the PUT', () => {
    const gateway = classifyUploadError({ status: 403, message: 'Forbidden' });
    const storage = classifyUploadError(
      new UploadTransportError('http', 403, 'AccessDenied'),
    );
    expect(gateway.key).toBe('errors.forbidden');
    expect(storage.key).toBe('errors.uploadRejected');
    expect(gateway.key).not.toBe(storage.key);
  });

  it('503 from the gateway → storage not configured', () => {
    expect(classifyUploadError({ status: 503, message: 'x' }).key).toBe(
      'errors.storageUnconfigured',
    );
  });

  it('413 → too large, and not retryable (the same bytes will fail again)', () => {
    const failure = classifyUploadError({ status: 413, message: 'x' });
    expect(failure.key).toBe('errors.tooLarge');
    expect(failure.retryable).toBe(false);
  });

  it("an unrecognised API error still carries the server's own message, never a bare shrug", () => {
    const failure = classifyUploadError({
      status: 500,
      message: 'Upstream service error',
    });
    expect(failure.detail).toBe('Upstream service error');
  });

  it('a thrown non-error is still classified, never left to crash a component', () => {
    expect(classifyUploadError('boom').key).toBe('errors.unknown');
    expect(classifyUploadError(undefined).key).toBe('errors.unknown');
  });
});

describe('formatUploadFailure', () => {
  it('appends the provider detail so the user sees the exact code', () => {
    const message = formatUploadFailure(
      {
        key: 'errors.uploadRejected',
        detail: 'SignatureDoesNotMatch',
        retryable: false,
      },
      () => 'Storage rejected the upload.',
    );
    expect(message).toBe(
      'Storage rejected the upload. (SignatureDoesNotMatch)',
    );
  });

  it('omits the parentheses when there is no detail', () => {
    const message = formatUploadFailure(
      { key: 'errors.cors', detail: null, retryable: false },
      () => 'Blocked by CORS.',
    );
    expect(message).toBe('Blocked by CORS.');
  });
});
