import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loc, portfolioItem, section } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { TrustSection } from './trust-section.js';
import type { TrustDomain } from './trust-domains.js';

const fintech = {
  id: 'c-fin',
  slug: 'fintech',
  name: loc('تقنية مالية', 'Fintech'),
};
const logistics = {
  id: 'c-log',
  slug: 'logistics',
  name: loc('لوجستيات', 'Logistics'),
};

/** A `trust` section linked to a hydrated `portfolio` collection: 2 fintech + 1 logistics. */
const trustSection = () =>
  section({
    type: 'trust',
    eyebrow: loc('', '01 · DOMAINS'),
    title: loc('', 'The systems that run the region'),
    subtitle: loc('', 'Live systems people rely on every day.'),
    collection: {
      collection: 'portfolio',
      items: [
        portfolioItem({ slug: 'a', category: fintech }),
        portfolioItem({ slug: 'b', category: fintech }),
        portfolioItem({ slug: 'c', category: logistics }),
      ],
    },
  });

describe('TrustSection', () => {
  it('derives the constellation domains (distinct categories + live counts) from the hydrated portfolio collection', () => {
    const { container } = render(
      <TrustSection section={trustSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-trust')).toBeInTheDocument();
    expect(container.querySelector('.web-trust-eyebrow')?.textContent).toBe(
      '01 · DOMAINS',
    );
    // 2 distinct domains → 2 stars + 2 labels
    expect(container.querySelectorAll('[data-const-star]')).toHaveLength(2);
    const names = [...container.querySelectorAll('.web-const-name')].map(
      (n) => n.textContent,
    );
    expect(names).toEqual(['Fintech', 'Logistics']);
    // fintech count = 2 (× 02), logistics = 1 (× 01) — mono LTR readout
    const counts = [...container.querySelectorAll('.web-const-count')].map(
      (n) => n.textContent,
    );
    expect(counts).toEqual(['× 02', '× 01']);
    // the chips fallback mirrors the same domains
    expect(
      [...container.querySelectorAll('.web-trust-chip-name')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['Fintech', 'Logistics']);
  });

  it('renders the injected animated Constellation for mode=live, the static figure otherwise', () => {
    const Constellation = vi.fn((_: { domains: TrustDomain[] }) => (
      <div data-testid="animated-constellation" />
    ));
    const live = render(
      <TrustSection
        section={trustSection()}
        locale="en"
        mode="live"
        Constellation={Constellation}
      />,
    );
    expect(live.getByTestId('animated-constellation')).toBeInTheDocument();
    // the static figure DOM is NOT rendered when the animated one is injected (mutually exclusive)
    expect(live.container.querySelector('[data-web-constellation]')).toBeNull();
    expect(Constellation).toHaveBeenCalled();

    // preview (admin) ignores the injected Constellation → static figure
    const preview = render(
      <TrustSection
        section={trustSection()}
        locale="en"
        mode="preview"
        Constellation={Constellation}
      />,
    );
    expect(
      preview.container.querySelector('[data-web-constellation]'),
    ).toBeInTheDocument();
    expect(
      preview.container.querySelector('[data-testid="animated-constellation"]'),
    ).toBeNull();
  });

  it('renders nothing live when no portfolio collection is linked, a placeholder in edit (F7)', () => {
    const empty = section({ type: 'trust' });
    const live = render(
      <TrustSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.querySelector('.web-trust')).toBeNull();

    const editing = render(
      <TrustSection section={empty} locale="en" mode="edit" />,
    );
    expect(editing.container.querySelector('.web-trust')).toBeInTheDocument();
    expect(
      editing.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('uses the coded TRUST_COPY head fallback + localizes AR', () => {
    const bare = section({
      type: 'trust',
      collection: {
        collection: 'portfolio',
        items: [portfolioItem({ category: fintech })],
      },
    });
    const { container } = render(
      <TrustSection section={bare} locale="ar" mode="live" />,
    );
    expect(container.querySelector('.web-trust-eyebrow')?.textContent).toBe(
      '٠١ · المجالات',
    );
    expect(container.querySelector('.web-const-name')?.textContent).toBe(
      'تقنية مالية',
    );
  });

  it('inline-edits the section head (title) in edit mode', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = trustSection();
    const { container } = render(
      <EditProvider value={ctx}>
        <TrustSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-trust-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'The region’s systems';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'The region’s systems',
      'en',
    );
  });

  it('SectionBlock dispatches the trust type to TrustSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={trustSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-trust')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
