import { describe, expect, it } from 'vitest';
import {
  isLocalizedMessage,
  localizedMessageSchema,
} from './localized-message.js';

describe('localizedMessage (U24)', () => {
  it('accepts a bare key', () => {
    const parsed = localizedMessageSchema.safeParse({
      messageKey: 'common.ok',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts string and number params', () => {
    const parsed = localizedMessageSchema.safeParse({
      messageKey: 'media.notFound',
      params: { id: 'abc', count: 3 },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unknown keys (.strict, N7)', () => {
    const parsed = localizedMessageSchema.safeParse({
      messageKey: 'common.ok',
      message: 'OK',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an empty key — a message with no key is prose (U24)', () => {
    expect(localizedMessageSchema.safeParse({ messageKey: '' }).success).toBe(
      false,
    );
  });

  describe('isLocalizedMessage', () => {
    it('narrows a well-formed value', () => {
      expect(isLocalizedMessage({ messageKey: 'common.ok' })).toBe(true);
      expect(
        isLocalizedMessage({
          messageKey: 'media.notFound',
          params: { id: 'a' },
        }),
      ).toBe(true);
    });

    it('rejects prose, null, and non-objects', () => {
      expect(isLocalizedMessage('Media asset not found')).toBe(false);
      expect(isLocalizedMessage(null)).toBe(false);
      expect(isLocalizedMessage(undefined)).toBe(false);
      expect(isLocalizedMessage({ message: 'nope' })).toBe(false);
    });

    it('tolerates the extra fields an exception response carries', () => {
      // Nest's HttpException response also holds `statusCode`/`error`/`errors`;
      // the guard must still recognize the key so the filter can translate it.
      expect(
        isLocalizedMessage({
          messageKey: 'validation.failed',
          errors: { name: 'validation.required' },
        }),
      ).toBe(true);
    });
  });
});
