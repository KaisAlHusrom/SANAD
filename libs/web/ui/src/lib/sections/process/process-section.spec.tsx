import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section } from '../../../test/fixtures.js';
import { readBlockLocalized } from '../../block-renderer/block-data.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { ProcessSection } from './process-section.js';
import { deriveProcessSteps } from './process-steps.js';
import type { ProcessStepView } from './process-step-view.types.js';

const processSection = () =>
  section({
    type: 'process',
    eyebrow: loc('', '03 · METHOD'),
    title: loc('', 'A clear path'),
    blocks: [
      block('step', {
        sortOrder: 2,
        data: { duration: { ar: 'أسبوع ٣', en: 'Week 3' } },
        title: loc('', 'Build'),
        body: loc('', 'We build it'),
      }),
      block('step', {
        sortOrder: 1,
        data: { duration: { ar: 'أسبوع ١', en: 'Week 1' } },
        title: loc('', 'Discover'),
        body: loc('', 'We learn'),
      }),
      // a deliverable joined to step 1 (position, not sortOrder)
      block('feature', {
        sortOrder: 9,
        data: { step: 1 },
        title: loc('', 'A brief'),
      }),
    ],
  });

describe('deriveProcessSteps', () => {
  it('derives ordered phases with position labels, joined deliverables + nested duration', () => {
    const steps = deriveProcessSteps(
      processSection(),
      'en',
      'What you receive',
    );
    expect(steps.map((step) => step.title)).toEqual(['Discover', 'Build']); // sorted by sortOrder
    expect(steps[0]?.label).toBe('01 / 02');
    expect(steps[1]?.label).toBe('02 / 02');
    expect(steps[0]?.duration).toBe('Week 1'); // LocalizedText inside data.duration
    expect(steps[0]?.deliverables).toEqual(['A brief']); // feature joined by data.step === 1
    expect(steps[1]?.deliverables).toEqual([]);
    expect(steps[0]?.giveLabel).toBe('What you receive');
  });
});

describe('readBlockLocalized', () => {
  it('reads a {ar,en} value off the loose data bag', () => {
    expect(
      readBlockLocalized({ duration: { ar: 'أ', en: 'w1' } }, 'duration'),
    ).toEqual({
      ar: 'أ',
      en: 'w1',
    });
  });
  it('returns blank both-locales when absent or malformed (never throws)', () => {
    expect(readBlockLocalized({}, 'duration')).toEqual({ ar: '', en: '' });
    expect(readBlockLocalized({ duration: 'oops' }, 'duration')).toEqual({
      ar: '',
      en: '',
    });
    expect(readBlockLocalized({ duration: null }, 'duration')).toEqual({
      ar: '',
      en: '',
    });
  });
});

describe('ProcessSection', () => {
  it('renders the head + static phase-briefing cards when no System is injected (admin preview)', () => {
    const { container } = render(
      <ProcessSection section={processSection()} locale="en" mode="preview" />,
    );
    expect(container.querySelector('.web-process-eyebrow')?.textContent).toBe(
      '03 · METHOD',
    );
    expect(container.querySelector('.web-process-title')?.textContent).toBe(
      'A clear path',
    );
    const cards = container.querySelectorAll(
      '.web-process-static .web-process-card',
    );
    expect(cards).toHaveLength(2);
    expect(
      container.querySelector('.web-process-card-title')?.textContent,
    ).toBe('Discover');
    expect(
      container.querySelector('.web-process-card-give-item')?.textContent,
    ).toBe('A brief');
  });

  it('renders the injected live System (not the static deck) in live mode', () => {
    const System = vi.fn((_props: { steps: ProcessStepView[] }) => (
      <div data-testid="moons" />
    ));
    const { container, getByTestId } = render(
      <ProcessSection
        section={processSection()}
        locale="en"
        mode="live"
        System={System}
      />,
    );
    expect(getByTestId('moons')).toBeInTheDocument();
    expect(container.querySelector('.web-process-static')).toBeNull();
    // the derived steps are handed to the System
    expect(System.mock.calls[0]?.[0]?.steps).toHaveLength(2);
  });

  it('falls back to coded head defaults when blank (F7)', () => {
    const { container } = render(
      <ProcessSection
        section={section({
          type: 'process',
          blocks: [block('step', { title: loc('', 'X') })],
        })}
        locale="en"
        mode="preview"
      />,
    );
    expect(container.querySelector('.web-process-eyebrow')?.textContent).toBe(
      '03 · METHOD',
    );
    expect(container.querySelector('.web-process-title')?.textContent).toBe(
      'A clear path, phase by phase',
    );
  });

  it('renders nothing in live when there are no steps, a placeholder in the editor', () => {
    const empty = section({ type: 'process' });
    const live = render(
      <ProcessSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.firstChild).toBeNull();
    const preview = render(
      <ProcessSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('commits an inline edit of a phase card title in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = processSection();
    const firstStep = [...sec.blocks]
      .filter((b) => b.type === 'step')
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (!firstStep) throw new Error('fixture must have a step block');
    const { container } = render(
      <EditProvider value={ctx}>
        <ProcessSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-process-card-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'Kickoff';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      {
        kind: 'block',
        sectionId: sec.id,
        blockId: firstStep.id,
        field: 'title',
      },
      'Kickoff',
      'en',
    );
  });

  it('SectionBlock dispatches the process type to ProcessSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={processSection()} locale="en" mode="preview" />,
    );
    expect(container.querySelector('.web-process')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
