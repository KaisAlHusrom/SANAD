import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { translate } from '@sanad/i18n';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({ email: z.string().email() }).strict();

function responseOf(fn: () => unknown): {
  messageKey?: string;
  errors?: Record<string, string>;
} {
  try {
    fn();
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).getResponse() as {
      messageKey?: string;
      errors?: Record<string, string>;
    };
  }
  throw new Error('unreachable');
}

describe('ZodValidationPipe', () => {
  it('returns the parsed value for valid input', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ email: 'a@b.co' })).toEqual({ email: 'a@b.co' });
  });

  it('throws a 400 whose message is a KEY the edge renders (U24)', () => {
    const pipe = new ZodValidationPipe(schema);
    const response = responseOf(() => pipe.transform({ email: 'nope' }));
    expect(response.messageKey).toBe('validation.failed');
    expect(translate('validation.failed', 'ar')).toBe(
      'تحقّق من الحقول المُدخلة.',
    );
  });

  it('maps each field error to a catalog key by Zod issue code', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(
      responseOf(() => pipe.transform({ email: 'nope' })).errors?.email,
    ).toBe('validation.invalidString');
    expect(responseOf(() => pipe.transform({})).errors?.email).toBe(
      'validation.required',
    );
    expect(responseOf(() => pipe.transform({ email: 1 })).errors?.email).toBe(
      'validation.invalidType',
    );
  });

  it('maps a too-small value and an unknown key', () => {
    const bounded = z.object({ age: z.number().min(18) }).strict();
    expect(
      responseOf(() => new ZodValidationPipe(bounded).transform({ age: 3 }))
        .errors?.age,
    ).toBe('validation.tooSmall');
    expect(
      responseOf(() =>
        new ZodValidationPipe(schema).transform({ email: 'a@b.co', x: 1 }),
      ).errors?.['_'],
    ).toBe('validation.unknownField');
  });

  it('keeps a schema-supplied custom message — an author-written key wins', () => {
    const custom = z
      .object({ name: z.string().min(1, 'content.slugConflict') })
      .strict();
    expect(
      responseOf(() => new ZodValidationPipe(custom).transform({ name: '' }))
        .errors?.name,
    ).toBe('content.slugConflict');
  });

  it('emits every field error as a key — never raw Zod English (U24)', () => {
    const pipe = new ZodValidationPipe(schema);
    for (const value of Object.values(
      responseOf(() => pipe.transform({ email: 'nope' })).errors ?? {},
    )) {
      expect(value).toMatch(/^[a-z][\w.]*$/);
    }
  });
});
