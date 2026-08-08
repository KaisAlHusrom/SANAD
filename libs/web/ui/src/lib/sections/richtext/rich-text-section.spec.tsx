import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { RichTextSection } from './rich-text-section.js';

const proseSection = () =>
  section({
    type: 'richtext',
    eyebrow: loc('', 'Our story'),
    title: loc('', 'Why we build phase by phase'),
    blocks: [
      block('richtext', { body: loc('', '<p>We chose a different way.</p>') }),
    ],
  });

describe('RichTextSection', () => {
  it('renders the head + the richtext block HTML (live)', () => {
    const { container } = render(
      <RichTextSection section={proseSection()} locale="en" mode="live" />,
    );
    expect(
      container.querySelector('.web-richtext-section'),
    ).toBeInTheDocument();
    expect(container.querySelector('.web-richtext-eyebrow')?.textContent).toBe(
      'Our story',
    );
    expect(container.querySelector('.web-richtext-title')?.textContent).toBe(
      'Why we build phase by phase',
    );
    // the trusted block HTML renders as prose
    expect(container.querySelector('.web-richtext-body p')?.textContent).toBe(
      'We chose a different way.',
    );
  });

  it('injects NO live fallback for a blank head field (privacy/terms render as-authored, F7=nothing)', () => {
    // a title-only section (the seeded legal shape) — no eyebrow present
    const { container } = render(
      <RichTextSection
        section={section({
          type: 'richtext',
          title: loc('', 'What we collect'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-richtext-title')?.textContent).toBe(
      'What we collect',
    );
    // the eyebrow was blank → nothing rendered (never a canned "Section label")
    expect(container.querySelector('.web-richtext-eyebrow')).toBeNull();
  });

  it('commits an inline edit of the title in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = proseSection();
    const { container } = render(
      <EditProvider value={ctx}>
        <RichTextSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-richtext-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'Our journey';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'Our journey',
      'en',
    );
  });

  it('SectionBlock dispatches the richtext type to RichTextSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={proseSection()} locale="en" mode="live" />,
    );
    expect(
      container.querySelector('.web-richtext-section'),
    ).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });

  it('shows a placeholder for an empty section in preview, nothing in live', () => {
    const empty = section({ type: 'richtext' });
    const preview = render(
      <RichTextSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
    const live = render(
      <RichTextSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.firstChild).toBeNull();
  });
});
