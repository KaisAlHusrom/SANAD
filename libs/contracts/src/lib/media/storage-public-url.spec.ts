import { describe, expect, it } from 'vitest';
import { isSignedOnlyPublicUrl } from './storage-public-url.js';

const API_ENDPOINT =
  'https://454036b46992914d1279a9de280a97de.r2.cloudflarestorage.com';

describe('isSignedOnlyPublicUrl (a public base that would 403 every <img>)', () => {
  it('flags the S3 API endpoint used as the public base (the live misconfiguration)', () => {
    expect(isSignedOnlyPublicUrl(API_ENDPOINT, API_ENDPOINT)).toBe(true);
  });

  it('flags any r2.cloudflarestorage.com host, even with a bucket path', () => {
    expect(isSignedOnlyPublicUrl(`${API_ENDPOINT}/bishola-images`, null)).toBe(
      true,
    );
  });

  it('accepts the r2.dev public dev URL', () => {
    expect(
      isSignedOnlyPublicUrl('https://pub-abc123.r2.dev', API_ENDPOINT),
    ).toBe(false);
  });

  it('accepts a custom CDN domain', () => {
    expect(isSignedOnlyPublicUrl('https://cdn.sanad.tech', API_ENDPOINT)).toBe(
      false,
    );
  });

  it('flags a public base that merely equals the endpoint host, whatever that host is', () => {
    expect(
      isSignedOnlyPublicUrl(
        'https://s3.internal:9000',
        'https://s3.internal:9000/x',
      ),
    ).toBe(true);
  });

  it('is quiet for unset or unparseable values (their own validation covers those)', () => {
    expect(isSignedOnlyPublicUrl(null, API_ENDPOINT)).toBe(false);
    expect(isSignedOnlyPublicUrl('', API_ENDPOINT)).toBe(false);
    expect(isSignedOnlyPublicUrl('not a url', API_ENDPOINT)).toBe(false);
  });
});
