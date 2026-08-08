import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { HeroSection } from './hero-section.js';

describe('HeroSection', () => {
  it('renders eyebrow/title/lead + the proof strip from feature blocks in live', () => {
    const { container } = render(
      <HeroSection
        section={section({
          type: 'hero',
          eyebrow: loc('', 'SANAD TECH'),
          title: loc('', 'We build your system'),
          subtitle: loc('', 'We turn your idea into a live product'),
          blocks: [
            block('feature', {
              sortOrder: 1,
              title: loc('', 'A weekly meeting'),
            }),
            block('feature', {
              sortOrder: 2,
              title: loc('', 'Phase-by-phase'),
            }),
          ],
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-hero-eyebrow')?.textContent).toContain(
      'SANAD TECH',
    );
    expect(container.querySelector('.web-hero-title')?.textContent).toBe(
      'We build your system',
    );
    expect(container.querySelector('.web-hero-lead')?.textContent).toBe(
      'We turn your idea into a live product',
    );
    const proof = [...container.querySelectorAll('.web-hero-proof-item')].map(
      (n) => n.textContent,
    );
    expect(proof).toEqual(['A weekly meeting', 'Phase-by-phase']);
  });

  it('falls back to coded defaults (headline + proof) when blank (F7)', () => {
    const { container } = render(
      <HeroSection
        section={section({ type: 'hero' })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-hero-title')?.textContent).toContain(
      'We build your system',
    );
    // no feature blocks → coded default proof items
    expect(container.querySelectorAll('.web-hero-proof-item').length).toBe(3);
  });

  it('commits an inline edit of the hero title in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = section({ type: 'hero', title: loc('', 'Old title') });
    const { container } = render(
      <EditProvider value={ctx}>
        <HeroSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-hero-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'New title';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'New title',
      'en',
    );
  });

  it('SectionBlock dispatches the hero type to HeroSection', () => {
    const { container } = render(
      <SectionBlock
        section={section({ type: 'hero' })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-hero')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });

  it('renders the anchorId as the section id (the cosmos docking contract)', () => {
    const { container } = render(
      <HeroSection
        section={section({ type: 'hero' })}
        locale="en"
        mode="live"
        anchorId="hero"
      />,
    );
    expect(container.querySelector('section.web-hero')?.id).toBe('hero');
    // omitted → no id (admin preview)
    const { container: bare } = render(
      <HeroSection
        section={section({ type: 'hero' })}
        locale="en"
        mode="preview"
      />,
    );
    expect(
      bare.querySelector('section.web-hero')?.getAttribute('id'),
    ).toBeNull();
  });

  it('renders injected Backdrop / Actions / Cue slots (live cosmos chrome)', () => {
    const slots = {
      Backdrop: () => <div data-testid="veil" />,
      Actions: ({
        primaryLabel,
        secondaryLabel,
      }: {
        primaryLabel: string;
        secondaryLabel: string;
      }) => (
        <>
          <a data-testid="cta-primary" href="/request-a-project">
            {primaryLabel}
          </a>
          <a data-testid="cta-secondary" href="#works">
            {secondaryLabel}
          </a>
        </>
      ),
      Cue: () => <div data-testid="cue" />,
    };
    const { container, getByTestId } = render(
      <HeroSection
        section={section({ type: 'hero' })}
        locale="en"
        mode="live"
        slots={slots}
      />,
    );
    expect(getByTestId('veil')).toBeInTheDocument();
    expect(getByTestId('cue')).toBeInTheDocument();
    // the injected actions carry the coded labels + replace the static defaults
    expect(getByTestId('cta-primary')).toHaveAttribute(
      'href',
      '/request-a-project',
    );
    expect(getByTestId('cta-primary').textContent).toBe('Start your project');
    expect(getByTestId('cta-secondary')).toHaveAttribute('href', '#works');
    expect(
      container.querySelectorAll('.web-hero-actions .web-cta').length,
    ).toBe(0);
  });

  it('defaults to static web-cta labels + no backdrop/cue when slots are omitted (admin preview)', () => {
    const { container } = render(
      <HeroSection
        section={section({ type: 'hero' })}
        locale="en"
        mode="preview"
      />,
    );
    const ctas = [
      ...container.querySelectorAll('.web-hero-actions .web-cta'),
    ].map((n) => n.textContent);
    expect(ctas).toEqual(['Start your project', 'See our work']);
  });
});
