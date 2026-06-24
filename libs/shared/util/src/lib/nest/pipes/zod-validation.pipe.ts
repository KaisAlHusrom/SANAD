import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Validates a request body/query/param against a Zod schema from `libs/contracts`
 * (N7), returning the parsed (and coerced) value. On failure throws a 400 with a
 * field→message map. Constructed per-use: `@Body(new ZodValidationPipe(schema))`.
 *
 * The schema's INPUT type is left open (`unknown`) so coerced/defaulted/**transformed**
 * schemas are accepted — e.g. a `'true'|'false'` query param transformed to a `boolean`
 * (N7). The OUTPUT (`TOut`) is inferred from the schema; the pipe only ever returns it.
 */
export class ZodValidationPipe<TOut> implements PipeTransform<unknown, TOut> {
  constructor(private readonly schema: ZodType<TOut, ZodTypeDef, unknown>) {}

  transform(value: unknown): TOut {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_';
      fieldErrors[path] ??= issue.message;
    }
    throw new BadRequestException({
      message: 'Validation failed',
      errors: fieldErrors,
    });
  }
}
