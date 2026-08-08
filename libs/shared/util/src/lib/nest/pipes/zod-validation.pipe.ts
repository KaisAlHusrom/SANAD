import { BadRequestException, PipeTransform } from '@nestjs/common';
import { hasMessage } from '@sanad/i18n';
import type { ZodIssue, ZodType, ZodTypeDef } from 'zod';

/**
 * Map a Zod issue to a `validation.*` catalog key (U24) — the raw Zod message is English
 * prose and must never reach the user. A schema that supplies its OWN message wins, as long
 * as that message is itself a key (the convention for a field-specific message).
 */
function issueKey(issue: ZodIssue): string {
  // An author-written key wins — but only if the catalog can actually render it, so a typo
  // degrades to the generic per-code key instead of leaking the raw string (U24).
  if (hasMessage(issue.message)) {
    return issue.message;
  }
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined'
        ? 'validation.required'
        : 'validation.invalidType';
    case 'too_small':
      return 'validation.tooSmall';
    case 'too_big':
      return 'validation.tooBig';
    case 'invalid_string':
      return 'validation.invalidString';
    case 'invalid_enum_value':
    case 'invalid_literal':
      return 'validation.invalidEnum';
    case 'unrecognized_keys':
      return 'validation.unknownField';
    default:
      return 'validation.invalidType';
  }
}

/**
 * Validates a request body/query/param against a Zod schema from `libs/contracts`
 * (N7), returning the parsed (and coerced) value. On failure throws a 400 carrying a
 * **message key** plus a field→key map (U24); the exception filter renders BOTH into the
 * caller's locale and puts the map on the error envelope's optional `errors` leaf, so a form
 * can attach a real reason to the exact field. Constructed per-use:
 * `@Body(new ZodValidationPipe(schema))`.
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
      fieldErrors[path] ??= issueKey(issue);
    }
    throw new BadRequestException({
      messageKey: 'validation.failed',
      errors: fieldErrors,
    });
  }
}
