import { describe, expect, it } from 'vitest';
import { contentNotFound, slugConflict } from './content-errors.js';

describe('content errors (U24)', () => {
  it('picks the entity-specific key so the sentence reads naturally per locale', () => {
    expect(contentNotFound('BlogPost', 'about-us').getError()).toEqual({
      statusCode: 404,
      messageKey: 'content.notFound.blogPost',
      params: { idOrSlug: 'about-us' },
    });
    expect(contentNotFound('MenuItem', 'm-1').getError()).toMatchObject({
      messageKey: 'content.notFound.menuItem',
    });
  });

  it('falls back to the generic key for an entity with no dedicated message', () => {
    expect(contentNotFound('Widget', 'w-1').getError()).toEqual({
      statusCode: 404,
      messageKey: 'content.notFound',
      params: { idOrSlug: 'w-1' },
    });
  });

  it('emits a keyed slug conflict (409), never prose', () => {
    expect(slugConflict('about').getError()).toEqual({
      statusCode: 409,
      messageKey: 'content.slugConflict',
      params: { slug: 'about' },
    });
  });
});
