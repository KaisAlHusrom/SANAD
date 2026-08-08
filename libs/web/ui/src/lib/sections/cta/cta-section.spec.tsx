import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { CtaSection } from './cta-section.js';

const ctaSection = () =>
  section({
    type: 'cta',
    eyebrow: loc('', 'FINAL LAYER — LAUNCH'),
    title: loc('', 'Ready to back your next project'),
    subtitle: loc('', 'Book a free discovery session'),
    blocks: [
      block('feature', { sortOrder: 2, title: loc('', 'Second step') }),
      block('feature', { sortOrder: 1, title: loc('', 'First step') }),
    ],
  });

describe('CtaSection', () => {
  it('renders the band head + feature-block steps in sort order (live)', () => {
    const { container } = render(
      <CtaSection section={ctaSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-cta-band')).toBeInTheDocument();
    expect(container.querySelector('.web-cta-eyebrow')?.textContent).toBe(
      'FINAL LAYER — LAUNCH',
    );
    expect(container.querySelector('.web-cta-title')?.textContent).toBe(
      'Ready to back your next project',
    );
    expect(container.querySelector('.web-cta-lead')?.textContent).toBe(
      'Book a free discovery session',
    );
    const steps = [...container.querySelectorAll('.web-cta-step-text')].map(
      (n) => n.textContent,
    );
    expect(steps).toEqual(['First step', 'Second step']); // sorted by sortOrder
  });

  it('falls back to coded default copy + steps when the CMS supplies none (F7)', () => {
    const { container } = render(
      <CtaSection section={section({ type: 'cta' })} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-cta-eyebrow')?.textContent).toBe(
      'FINAL LAYER — LAUNCH',
    );
    expect(container.querySelector('.web-cta-title')?.textContent).toBe(
      'Ready to back your next project',
    );
    // no feature blocks → the three coded CTA_COPY.steps
    expect(container.querySelectorAll('.web-cta-step')).toHaveLength(3);
  });

  it('renders the default static Actions (no links) when the website injects no slots (admin preview)', () => {
    const { container } = render(
      <CtaSection section={ctaSection()} locale="en" mode="preview" />,
    );
    // PlainActions = two static `.web-cta` spans; no Backdrop chrome
    const ctas = container.querySelectorAll('.web-cta');
    expect(ctas).toHaveLength(2);
    expect(container.querySelector('a[href]')).toBeNull();
    expect(container.querySelector('.lp-cta-veil')).toBeNull();
  });

  it('commits an inline edit of a step title in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = ctaSection();
    const firstStep = [...sec.blocks].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )[0];
    if (!firstStep) throw new Error('fixture must have a feature block');
    const { container } = render(
      <EditProvider value={ctx}>
        <CtaSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const step = container.querySelector(
      '.web-cta-step-text .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(step.parentElement as HTMLElement);
    step.textContent = 'Reworded step';
    fireEvent.keyDown(step, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      {
        kind: 'block',
        sectionId: sec.id,
        blockId: firstStep.id,
        field: 'title',
      },
      'Reworded step',
      'en',
    );
  });

  it('SectionBlock dispatches the cta type to CtaSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={ctaSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-cta-band')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
