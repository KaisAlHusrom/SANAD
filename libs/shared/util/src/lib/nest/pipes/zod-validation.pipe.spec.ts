import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({ email: z.string().email() }).strict();

describe('ZodValidationPipe', () => {
  it('returns the parsed value for valid input', () => {
    const pipe = new ZodValidationPipe(schema);
    expect(pipe.transform({ email: 'a@b.co' })).toEqual({ email: 'a@b.co' });
  });

  it('throws a 400 with a field error map for invalid input', () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({ email: 'nope' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors: Record<string, string>;
      };
      expect(response.errors.email).toBeTypeOf('string');
    }
  });
});
