import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  MEDIA_PUBLIC_RESOLVE_MAX_IDS,
  mediaPublicResolveRequestSchema,
} from './media-public-resolve.zod.types.js';

describe('mediaPublicResolveRequestSchema', () => {
  it('accepts a bounded list of uuid ids', () => {
    const ids = [randomUUID(), randomUUID()];
    expect(mediaPublicResolveRequestSchema.parse({ ids }).ids).toEqual(ids);
  });

  it('accepts an empty list (a page with no images)', () => {
    expect(mediaPublicResolveRequestSchema.parse({ ids: [] }).ids).toEqual([]);
  });

  it('rejects a non-uuid id', () => {
    expect(() =>
      mediaPublicResolveRequestSchema.parse({ ids: ['not-a-uuid'] }),
    ).toThrow();
  });

  it('rejects more than the max ids', () => {
    const ids = Array.from({ length: MEDIA_PUBLIC_RESOLVE_MAX_IDS + 1 }, () =>
      randomUUID(),
    );
    expect(() => mediaPublicResolveRequestSchema.parse({ ids })).toThrow();
  });

  it('is strict — rejects unknown keys (N7)', () => {
    expect(() =>
      mediaPublicResolveRequestSchema.parse({ ids: [], extra: true }),
    ).toThrow();
  });
});
