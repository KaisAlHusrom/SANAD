import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loc, portfolioItem, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import type { WorkCardData } from './derive-work-cards.js';
import type { WorkCardLabels } from './work-card.types.js';
import { WorksSection } from './works-section.js';

/** A `work` section linked to a hydrated `portfolio` collection (2 published projects). */
const workSection = () =>
  section({
    type: 'work',
    eyebrow: loc('', '04 · OUR WORK'),
    title: loc('', 'Work that speaks in numbers'),
    collection: {
      collection: 'portfolio',
      items: [
        portfolioItem({ slug: 'pay', clientName: 'Acme', coverMediaId: 'm1' }),
        portfolioItem({
          slug: 'shop',
          clientName: 'Globex',
          coverMediaId: null,
        }),
      ],
    },
  });

describe('WorksSection', () => {
  it('renders the head + a card per hydrated portfolio project', () => {
    const { container } = render(
      <WorksSection section={workSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-works')).toBeInTheDocument();
    expect(container.querySelector('.web-works-eyebrow')?.textContent).toBe(
      '04 · OUR WORK',
    );
    expect(container.querySelectorAll('[data-orbit-card]')).toHaveLength(2);
    expect(
      [...container.querySelectorAll('.web-orbit-client')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['Acme', 'Globex']);
  });

  it('renders a cover img when the resolver returns a url, a placeholder frame otherwise', () => {
    const resolveImageUrl = vi.fn((id: string) =>
      id === 'm1' ? 'https://cdn/x.jpg' : '',
    );
    const { container } = render(
      <WorksSection
        section={workSection()}
        locale="en"
        mode="live"
        resolveImageUrl={resolveImageUrl}
      />,
    );
    const imgs = container.querySelectorAll('.web-orbit-cover-img');
    expect(imgs).toHaveLength(1); // only the project WITH a resolvable cover
    expect(imgs[0]?.getAttribute('src')).toBe('https://cdn/x.jpg');
    // the coverless project shows the placeholder frame (never a broken image)
    expect(container.querySelectorAll('.web-orbit-cover-frame')).toHaveLength(
      1,
    );
    expect(resolveImageUrl).toHaveBeenCalledWith('m1');
  });

  it('sets the #works anchor id when provided (hero/CTA link here)', () => {
    const { container } = render(
      <WorksSection
        section={workSection()}
        locale="en"
        mode="live"
        anchorId="works"
      />,
    );
    expect(
      container.querySelector('section#works.web-works'),
    ).toBeInTheDocument();
  });

  it('renders the injected animated Orbit for mode=live, the static figure otherwise', () => {
    const Orbit = vi.fn(
      (_: {
        head: React.ReactNode;
        cards: WorkCardData[];
        labels: WorkCardLabels;
        dir: 1 | -1;
        locale: 'ar' | 'en';
      }) => <div data-testid="animated-orbit" />,
    );
    const live = render(
      <WorksSection
        section={workSection()}
        locale="en"
        mode="live"
        Orbit={Orbit}
      />,
    );
    expect(live.getByTestId('animated-orbit')).toBeInTheDocument();
    // the static grid is NOT rendered when the animated ring is injected (mutually exclusive)
    expect(live.container.querySelector('.web-orbit--static')).toBeNull();
    expect(Orbit).toHaveBeenCalled();

    // preview (admin) ignores the injected Orbit → static figure grid
    const preview = render(
      <WorksSection
        section={workSection()}
        locale="en"
        mode="preview"
        Orbit={Orbit}
      />,
    );
    expect(
      preview.container.querySelector('.web-orbit--static'),
    ).toBeInTheDocument();
    expect(
      preview.container.querySelector('[data-testid="animated-orbit"]'),
    ).toBeNull();
  });

  it('links each card via the injected CardLink (default a-tag → /portfolio/<slug>)', () => {
    const { container } = render(
      <WorksSection section={workSection()} locale="en" mode="preview" />,
    );
    const links = [...container.querySelectorAll('a.web-orbit-link')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/portfolio/pay',
      '/portfolio/shop',
    ]);
  });

  it('renders nothing live when no projects are linked, a placeholder in edit (F7)', () => {
    const empty = section({ type: 'work' });
    const live = render(
      <WorksSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.querySelector('.web-works')).toBeNull();

    const editing = render(
      <WorksSection section={empty} locale="en" mode="edit" />,
    );
    expect(editing.container.querySelector('.web-works')).toBeInTheDocument();
    expect(
      editing.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('uses the coded WORKS_COPY head fallback + localizes AR', () => {
    const bare = section({
      type: 'work',
      collection: { collection: 'portfolio', items: [portfolioItem()] },
    });
    const { container } = render(
      <WorksSection section={bare} locale="ar" mode="live" />,
    );
    expect(container.querySelector('.web-works-eyebrow')?.textContent).toBe(
      '٠٤ · أعمالنا',
    );
    expect(container.querySelector('.web-works-title')?.textContent).toBe(
      'أعمالٌ تتحدّث بالأرقام',
    );
  });

  it('inline-edits the section head (title) in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = workSection();
    const { container } = render(
      <EditProvider value={ctx}>
        <WorksSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-works-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'Case studies';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'Case studies',
      'en',
    );
  });

  it('SectionBlock dispatches the work type to WorksSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={workSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-works')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });

  it('wraps each card in a record-edit affordance in the studio (mode=edit) → deep-links to the project', () => {
    const onEditRecord = vi.fn();
    const sec = section({
      type: 'work',
      collection: {
        collection: 'portfolio',
        items: [portfolioItem({ id: 'p-1', slug: 'pay' })],
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
        <WorksSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const btn = container.querySelector('.web-record-edit-btn');
    expect(btn).not.toBeNull();
    fireEvent.click(btn as HTMLElement);
    expect(onEditRecord).toHaveBeenCalledWith('portfolio', 'p-1');
  });
});
