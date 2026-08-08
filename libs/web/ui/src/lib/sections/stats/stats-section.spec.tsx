import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { StatsSection } from './stats-section.js';

const statsSection = () =>
  section({
    type: 'stats',
    eyebrow: loc('', '05 · TELEMETRY'),
    title: loc('', 'The numbers'),
    blocks: [
      block('stat', {
        sortOrder: 1,
        data: { value: '120', suffix: '+' },
        title: loc('', 'projects'),
        body: loc('', 'since 2018'),
      }),
    ],
  });

describe('StatsSection', () => {
  it('renders the head + a stat cell (value/suffix/label/note) in live', () => {
    const { container } = render(
      <StatsSection section={statsSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-stats-eyebrow')?.textContent).toBe(
      '05 · TELEMETRY',
    );
    expect(container.querySelector('.web-stats-title')?.textContent).toBe(
      'The numbers',
    );
    expect(container.querySelector('.web-stat-value')?.textContent).toBe(
      '120+',
    );
    expect(container.querySelector('.web-stat-label')?.textContent).toBe(
      'projects',
    );
    expect(container.querySelector('.web-stat-note')?.textContent).toBe(
      'since 2018',
    );
  });

  it('falls back to coded defaults when the head is blank (F7)', () => {
    const { container } = render(
      <StatsSection
        section={section({
          type: 'stats',
          blocks: [block('stat', { data: { value: '9' } })],
        })}
        locale="en"
        mode="live"
      />,
    );
    // blank eyebrow/title fall back to STATS_COPY
    expect(container.querySelector('.web-stats-eyebrow')?.textContent).toBe(
      '05 · TELEMETRY',
    );
    expect(container.querySelector('.web-stats-title')?.textContent).toBe(
      'The numbers behind the voyage',
    );
  });

  it('renders nothing in live when there are no stat blocks, a placeholder in the editor', () => {
    const empty = section({ type: 'stats' });
    const live = render(
      <StatsSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.firstChild).toBeNull();

    const preview = render(
      <StatsSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('commits an inline edit of the title and a stat value in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = statsSection();
    const { container } = render(
      <EditProvider value={ctx}>
        <StatsSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );

    // edit the section title
    const title = container.querySelector(
      '.web-stats-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'Our numbers';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'Our numbers',
      'en',
    );

    // the stat value is an editable block-data field (not the animated counter) in edit mode
    const statBlock = sec.blocks[0];
    if (!statBlock) throw new Error('fixture must have a stat block');
    const value = container.querySelector(
      '.web-stat-value .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(value.parentElement as HTMLElement);
    value.textContent = '200';
    fireEvent.keyDown(value, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      {
        kind: 'block-data',
        sectionId: sec.id,
        blockId: statBlock.id,
        key: 'value',
      },
      '200',
      'en',
    );
  });

  it('SectionBlock dispatches the stats type to StatsSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={statsSection()} locale="en" mode="live" />,
    );
    // the per-type layout, not the generic `.web-section`/`.web-heading`
    expect(container.querySelector('.web-stats')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
