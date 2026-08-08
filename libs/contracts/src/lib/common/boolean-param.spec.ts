import { describe, expect, it } from 'vitest';
import { booleanParamSchema } from './boolean-param.js';

describe('booleanParamSchema', () => {
  it('parses the query-string literals', () => {
    expect(booleanParamSchema.parse('true')).toBe(true);
    expect(booleanParamSchema.parse('false')).toBe(false);
  });

  it('is idempotent — accepts an already-parsed boolean', () => {
    // The gateway validates a query, transforms `'true'` → `true`, then forwards the
    // transformed object to the service, which re-validates with the SAME schema (MS4).
    // A non-idempotent transform would reject the boolean on the second pass.
    expect(booleanParamSchema.parse(true)).toBe(true);
    expect(booleanParamSchema.parse(false)).toBe(false);
  });

  it('rejects arbitrary strings (never z.coerce.boolean — N7)', () => {
    expect(booleanParamSchema.safeParse('yes').success).toBe(false);
    expect(booleanParamSchema.safeParse('1').success).toBe(false);
    expect(booleanParamSchema.safeParse('').success).toBe(false);
  });
});
