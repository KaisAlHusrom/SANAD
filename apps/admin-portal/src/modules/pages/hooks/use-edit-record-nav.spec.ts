import { describe, expect, it } from 'vitest';
import { editRecordPath } from './use-edit-record-nav';

describe('editRecordPath', () => {
  it('routes blog to its editor route, portfolio/testimonials to their ?edit deep-link', () => {
    expect(editRecordPath('blog', 'b1')).toBe('/content/blog/b1/edit');
    expect(editRecordPath('portfolio', 'p1')).toBe(
      '/content/portfolio?edit=p1',
    );
    expect(editRecordPath('testimonials', 't1')).toBe(
      '/content/testimonials?edit=t1',
    );
  });

  it('falls back to the services list (services cards carry no cover deep-link)', () => {
    expect(editRecordPath('services', 's1')).toBe('/content/services');
  });
});
