import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { faqItem, loc, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { FaqSection } from './faq-section.js';

const faqSection = () =>
  section({
    type: 'faq',
    eyebrow: loc('', '01 · QUESTIONS'),
    title: loc('', 'Straight answers'),
    collection: {
      collection: 'faq',
      items: [
        faqItem({
          question: loc('', 'How do you price?'),
          answer: loc('', 'Per phase.'),
          category: 'pricing',
        }),
        faqItem({
          question: loc('', 'What after launch?'),
          answer: loc('', 'We support you.'),
          category: 'support',
        }),
      ],
    },
  });

describe('FaqSection', () => {
  it('renders the head + one disclosure per hydrated FAQ (live), collapsed by default', () => {
    const { container } = render(
      <FaqSection section={faqSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-faq')).toBeInTheDocument();
    expect(container.querySelector('.web-faq-eyebrow')?.textContent).toBe(
      '01 · QUESTIONS',
    );
    expect(container.querySelectorAll('.web-faq-item')).toHaveLength(2);
    const first = container.querySelector('.web-faq-q') as HTMLButtonElement;
    expect(first.getAttribute('aria-expanded')).toBe('false');
    // the answer is always in the DOM (SEO) even when collapsed
    expect(container.querySelector('.web-faq-answer-text')?.textContent).toBe(
      'Per phase.',
    );
  });

  it('toggles a row open on click', () => {
    const { container } = render(
      <FaqSection section={faqSection()} locale="en" mode="live" />,
    );
    const first = container.querySelector('.web-faq-q') as HTMLButtonElement;
    fireEvent.click(first);
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(
      container.querySelector('.web-faq-item')?.getAttribute('data-open'),
    ).toBe('true');
  });

  it('falls back to coded head copy when the CMS supplies none (F7)', () => {
    const { container } = render(
      <FaqSection
        section={section({
          type: 'faq',
          collection: { collection: 'faq', items: [faqItem()] },
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-faq-title')?.textContent).toBe(
      'Straight answers',
    );
  });

  it('renders a RecordEditFrame per row in edit mode (deep-link to the FAQ record)', () => {
    const onEditRecord = vi.fn();
    const ctx: EditContextValue = {
      locale: 'en',
      onCommit: vi.fn(),
      onEditRecord,
    };
    const { container } = render(
      <EditProvider value={ctx}>
        <FaqSection section={faqSection()} locale="en" mode="edit" />
      </EditProvider>,
    );
    expect(container.querySelectorAll('.web-record-edit-btn')).toHaveLength(2);
  });

  it('empty collection → placeholder in preview, nothing in live', () => {
    const empty = section({ type: 'faq' });
    const preview = render(
      <FaqSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
    const live = render(<FaqSection section={empty} locale="en" mode="live" />);
    expect(live.container.firstChild).toBeNull();
  });

  it('SectionBlock dispatches the faq type to FaqSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={faqSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-faq')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
