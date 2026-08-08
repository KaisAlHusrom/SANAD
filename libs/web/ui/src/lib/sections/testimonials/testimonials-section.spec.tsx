import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loc, section, testimonialItem } from '../../../test/fixtures.js';
import { EditProvider } from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { TestimonialsSection } from './testimonials-section.js';

/** A `testimonials` section linked to a hydrated `testimonials` collection of 2 quotes. */
const testimonialsSection = () =>
  section({
    type: 'testimonials',
    eyebrow: loc('', '06 · TRANSMISSIONS'),
    title: loc('', 'What our partners say'),
    collection: {
      collection: 'testimonials',
      items: [
        testimonialItem({
          authorName: 'Layla Mansour',
          companyName: 'Tadawul Pay',
          rating: 5,
          quote: loc('فريقٌ يُسنِدك', 'A team that backs you'),
        }),
        testimonialItem({
          authorName: 'Omar Nasser',
          companyName: 'Wasla',
          rating: 4,
          avatarMediaId: 'media-omar',
          quote: loc('شراكةٌ حقيقية', 'A true partnership'),
        }),
      ],
    },
  });

describe('TestimonialsSection', () => {
  it('renders the head + one card per hydrated testimonial with mono TRX designations', () => {
    const { container } = render(
      <TestimonialsSection
        section={testimonialsSection()}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-quotes')).toBeInTheDocument();
    expect(container.querySelector('.web-quotes-eyebrow')?.textContent).toBe(
      '06 · TRANSMISSIONS',
    );
    const cards = container.querySelectorAll('.web-quote');
    expect(cards).toHaveLength(2);
    const designations = [...container.querySelectorAll('.web-micro')].map(
      (n) => n.textContent,
    );
    expect(designations).toEqual(['TRX·01', 'TRX·02']);
    // rating → diamond marks (5 then 4)
    expect(cards[0]?.querySelectorAll('.web-trx-rating-mark')).toHaveLength(5);
    expect(cards[1]?.querySelectorAll('.web-trx-rating-mark')).toHaveLength(4);
    expect(container.querySelector('.web-quote-text')?.textContent).toBe(
      'A team that backs you',
    );
    const roles = [...container.querySelectorAll('.web-quote-role')].map(
      (n) => n.textContent,
    );
    expect(roles[0]).toBe('CEO · Tadawul Pay');
  });

  it('bakes the avatar url server-side (resolveImageUrl) → a real <img>, gradient disc otherwise', () => {
    const { container } = render(
      <TestimonialsSection
        section={testimonialsSection()}
        locale="en"
        mode="live"
        resolveImageUrl={(mediaId) => `https://cdn/${mediaId}.webp`}
      />,
    );
    const imgs = container.querySelectorAll('img.web-avatar-img');
    // only the second testimonial has an avatarMediaId → exactly one resolved photo
    expect(imgs).toHaveLength(1);
    expect(imgs[0]?.getAttribute('src')).toBe('https://cdn/media-omar.webp');
    // the first (no avatar) keeps the gradient disc
    expect(
      container.querySelectorAll('.web-avatar:not(.web-avatar-img)'),
    ).toHaveLength(1);
  });

  it('renders nothing live when no testimonials collection is linked, a placeholder in edit (F7)', () => {
    const empty = section({ type: 'testimonials' });
    const live = render(
      <TestimonialsSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.querySelector('.web-quotes')).toBeNull();

    const edit = render(
      <TestimonialsSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      edit.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('wraps each card in a record-edit affordance in the studio (mode=edit) → deep-links to the testimonial', () => {
    const onEditRecord = vi.fn();
    const sec = section({
      type: 'testimonials',
      collection: {
        collection: 'testimonials',
        items: [testimonialItem({ id: 't-1', authorName: 'Layla' })],
      },
    });
    const { container } = render(
      <EditProvider
        value={{
          locale: 'en',
          onCommit: vi.fn(),
          onEditRecord,
          editRecordLabel: 'Edit record',
        }}
      >
        <TestimonialsSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const btn = container.querySelector('.web-record-edit-btn');
    expect(btn).not.toBeNull();
    fireEvent.click(btn as HTMLElement);
    expect(onEditRecord).toHaveBeenCalledWith('testimonials', 't-1');
  });

  it('dispatches through the SECTION_REGISTRY (SectionBlock renders the shared component)', () => {
    const { container } = render(
      <SectionBlock
        section={testimonialsSection()}
        locale="ar"
        mode="preview"
      />,
    );
    // the registry dispatch renders `.web-quotes`, NOT the generic `.web-heading` fallback
    expect(container.querySelector('.web-quotes')).toBeInTheDocument();
    expect(container.querySelectorAll('.web-quote')).toHaveLength(2);
  });
});
