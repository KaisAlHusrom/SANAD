import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc, section, serviceItem } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { ServicesSection } from './services-section.js';

const servicesSection = () =>
  section({
    type: 'services',
    eyebrow: loc('', '02 · SYSTEMS'),
    title: loc('', 'A full capability under one roof'),
    subtitle: loc('', 'One team designs, builds and operates.'),
    // a joined capability + tech for the saas card (data.service === slug)
    blocks: [
      block('feature', {
        data: { service: 'saas' },
        title: loc('', 'Scales to a million'),
      }),
      block('text', { data: { service: 'saas', tech: 'NestJS · Postgres' } }),
    ],
    collection: {
      collection: 'services',
      items: [
        serviceItem({
          slug: 'saas',
          title: loc('', 'SaaS platforms'),
          summary: loc('', 'Cloud products'),
        }),
        serviceItem({
          slug: 'mobile',
          title: loc('', 'Mobile apps'),
          summary: loc('', 'Native apps'),
        }),
      ],
    },
  });

describe('ServicesSection', () => {
  it('renders the head + a card per hydrated service, with the SYS designation (live)', () => {
    const { container } = render(
      <ServicesSection section={servicesSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-services')).toBeInTheDocument();
    expect(container.querySelector('.web-services-eyebrow')?.textContent).toBe(
      '02 · SYSTEMS',
    );
    expect(container.querySelector('.web-services-title')?.textContent).toBe(
      'A full capability under one roof',
    );
    const cards = container.querySelectorAll('.web-sys');
    expect(cards).toHaveLength(2);
    const designations = [...container.querySelectorAll('.web-micro')].map(
      (n) => n.textContent,
    );
    expect(designations).toEqual(['SYS·01 / SAAS', 'SYS·02 / MOBILE']);
    expect(container.querySelector('.web-sys-title')?.textContent).toBe(
      'SaaS platforms',
    );
  });

  it('joins CMS feature/text blocks to a card by data.service; falls back to coded caps/tech (U9/F7)', () => {
    const { container } = render(
      <ServicesSection section={servicesSection()} locale="en" mode="live" />,
    );
    const cards = [...container.querySelectorAll('.web-sys')];
    // saas card: the joined feature cap + joined tech
    const saas = cards[0] as HTMLElement;
    expect(
      [...saas.querySelectorAll('.web-sys-cap')].map((n) => n.textContent),
    ).toContain('Scales to a million');
    expect(saas.querySelector('.web-sys-tech')?.textContent).toBe(
      'NestJS · Postgres',
    );
    // mobile card: no joined blocks → coded SERVICES_COPY.systems.mobile fallback caps + tech
    const mobile = cards[1] as HTMLElement;
    expect(mobile.querySelectorAll('.web-sys-cap').length).toBeGreaterThan(0);
    expect(mobile.querySelector('.web-sys-tech')?.textContent).toBe(
      'React Native · TypeScript · Fastlane',
    );
  });

  it('renders nothing live when the section links no services, a placeholder in edit', () => {
    const empty = section({ type: 'services' });
    const live = render(
      <ServicesSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.querySelector('.web-services')).toBeNull();

    const editing = render(
      <ServicesSection section={empty} locale="en" mode="edit" />,
    );
    expect(
      editing.container.querySelector('.web-services'),
    ).toBeInTheDocument();
    expect(
      editing.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
  });

  it('inline-edits the section head (title) in edit mode; cards stay plain (collection-owned)', () => {
    const onCommit = vi.fn();
    const ctx: EditContextValue = { locale: 'en', onCommit };
    const sec = servicesSection();
    const { container } = render(
      <EditProvider value={ctx}>
        <ServicesSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const title = container.querySelector(
      '.web-services-title .web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(title.parentElement as HTMLElement);
    title.textContent = 'Everything under one roof';
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(
      { kind: 'section', sectionId: sec.id, field: 'title' },
      'Everything under one roof',
      'en',
    );
    // card titles are plain text (edited in the Services module), not editable islands
    expect(
      container.querySelector('.web-sys-title .web-editable-content'),
    ).toBeNull();
  });

  it('SectionBlock dispatches the services type to ServicesSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={servicesSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-services')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
