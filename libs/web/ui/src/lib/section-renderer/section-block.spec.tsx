import type { SectionType } from '@sanad/contracts';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { block, loc, section } from '../../test/fixtures.js';
import { SectionBlock } from './section-block.js';

/**
 * Every real `SectionType` now has a bespoke registry component (Phase 5), so the generic
 * eyebrow/title/subtitle + blocks body is reached ONLY for an unrecognized/forward-compat type. These
 * tests exercise that defensive fallback with a type the registry doesn't know.
 */
const UNREGISTERED = 'legacy-banner' as SectionType;
const generic = (overrides = {}) =>
  section({ type: UNREGISTERED, ...overrides });

describe('SectionBlock', () => {
  it('renders the localized eyebrow, heading and subtitle (generic fallback)', () => {
    const { container } = render(
      <SectionBlock
        section={generic({
          eyebrow: loc('', 'Who we are'),
          title: loc('', 'Sanad Tech'),
          subtitle: loc('', 'We build software'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-kicker')?.textContent).toBe(
      'Who we are',
    );
    expect(container.querySelector('.web-heading')?.textContent).toBe(
      'Sanad Tech',
    );
    expect(container.querySelector('.web-subtitle')?.textContent).toBe(
      'We build software',
    );
  });

  it('renders blocks in sortOrder regardless of input order (generic fallback)', () => {
    const { container } = render(
      <SectionBlock
        section={generic({
          title: loc('', 'S'),
          blocks: [
            block('text', { sortOrder: 2, title: loc('', 'second') }),
            block('text', { sortOrder: 1, title: loc('', 'first') }),
          ],
        })}
        locale="en"
        mode="live"
      />,
    );
    const titles = [...container.querySelectorAll('.web-block-title')].map(
      (node) => node.textContent,
    );
    expect(titles).toEqual(['first', 'second']);
  });

  it('dims an unpublished section only in preview mode (generic fallback)', () => {
    const unpublished = generic({ title: loc('', 'S'), published: false });
    const preview = render(
      <SectionBlock section={unpublished} locale="en" mode="preview" />,
    );
    expect(preview.container.querySelector('section')).toHaveClass(
      'web-section--unpublished',
    );

    const live = render(
      <SectionBlock section={unpublished} locale="en" mode="live" />,
    );
    expect(live.container.querySelector('section')).not.toHaveClass(
      'web-section--unpublished',
    );
  });

  it('shows a placeholder for an empty section in preview, nothing in live (generic fallback)', () => {
    const preview = render(
      <SectionBlock section={generic()} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();

    const live = render(
      <SectionBlock section={generic()} locale="en" mode="live" />,
    );
    expect(live.container.firstChild).toBeNull();
  });
});
